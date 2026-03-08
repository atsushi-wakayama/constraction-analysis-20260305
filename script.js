/* ============================================
   紀の物語 — Ki no Monogatari
   JavaScript: カート / アニメーション / フィルター
============================================ */

'use strict';

/* ── カート状態管理 ── */
const cart = {
  items: [],

  add(id, name, price) {
    const existing = this.items.find(i => i.id === id);
    if (existing) {
      existing.qty++;
    } else {
      this.items.push({ id, name, price, qty: 1 });
    }
    this.save();
    this.render();
    updateCartCount();
  },

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
    this.render();
    updateCartCount();
  },

  changeQty(id, delta) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      this.remove(id);
    } else {
      this.save();
      this.render();
      updateCartCount();
    }
  },

  get total() {
    return this.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  },

  get count() {
    return this.items.reduce((sum, i) => sum + i.qty, 0);
  },

  save() {
    try {
      localStorage.setItem('ki_no_monogatari_cart', JSON.stringify(this.items));
    } catch (e) { /* localStorage unavailable */ }
  },

  load() {
    try {
      const saved = localStorage.getItem('ki_no_monogatari_cart');
      if (saved) this.items = JSON.parse(saved);
    } catch (e) { this.items = []; }
  },

  render() {
    const container = document.getElementById('cartItems');
    const footer    = document.getElementById('cartFooter');
    const totalEl   = document.getElementById('cartTotal');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = '<p class="cart-empty">かごの中は空です</p>';
      if (footer) footer.style.display = 'none';
      return;
    }

    if (footer) footer.style.display = 'block';
    if (totalEl) totalEl.textContent = '¥' + this.total.toLocaleString('ja-JP');

    container.innerHTML = this.items.map(item => `
      <div class="cart-item">
        <div class="cart-item-info" style="flex:1">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-controls">
            <button class="cart-item-qty-btn" onclick="cart.changeQty('${item.id}', -1)" aria-label="減らす">−</button>
            <span class="cart-item-qty">${item.qty}</span>
            <button class="cart-item-qty-btn" onclick="cart.changeQty('${item.id}', 1)" aria-label="増やす">＋</button>
          </div>
        </div>
        <div class="cart-item-right" style="text-align:right">
          <div class="cart-item-price">¥${(item.price * item.qty).toLocaleString('ja-JP')}</div>
          <button onclick="cart.remove('${item.id}')" style="
            background:none;border:none;cursor:pointer;
            font-size:0.7rem;color:#6B5B4E;margin-top:0.5rem;
            text-decoration:underline;
          ">削除</button>
        </div>
      </div>
    `).join('');
  }
};

/* ── カート数表示 ── */
function updateCartCount() {
  const countEl = document.getElementById('cartCount');
  if (!countEl) return;
  const count = cart.count;
  countEl.textContent = count;
  countEl.classList.toggle('visible', count > 0);
}

/* ── カートドロワー開閉 ── */
function openCart() {
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

/* ── トースト通知 ── */
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ── 商品フィルタリング ── */
function initCategoryFilter() {
  const buttons = document.querySelectorAll('.category-item');
  const cards   = document.querySelectorAll('.product-card');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.category;

      // アクティブ切り替え
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // カード表示/非表示
      cards.forEach(card => {
        const show = cat === 'all' || card.dataset.category === cat;
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        if (show) {
          card.style.opacity = '1';
          card.style.transform = '';
          card.style.display = 'flex';
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.96)';
          setTimeout(() => {
            if (card.dataset.category !== cat && cat !== 'all') {
              card.style.display = 'none';
            }
          }, 300);
        }
      });
    });
  });
}

/* ── カートに追加ボタン ── */
function initAddToCartButtons() {
  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const { id, name, price } = btn.dataset;
      cart.add(id, name, parseInt(price));
      showToast(`「${name}」をかごに入れました`);

      // ボタンフィードバック
      btn.classList.add('added');
      const original = btn.textContent;
      btn.textContent = '✓ 追加しました';
      setTimeout(() => {
        btn.classList.remove('added');
        btn.textContent = original;
      }, 1800);
    });
  });
}

/* ── スクロール検知 (ヘッダー・フェードイン) ── */
function initScrollAnimations() {
  const header = document.getElementById('header');

  // Intersection Observer でフェードイン
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  // フェードイン対象要素にクラスを付与
  const targets = [
    '.product-card',
    '.stat',
    '.region-card',
    '.story-frame',
    '.featured-text',
    '.featured-visual',
    '.category-section',
    '.newsletter-inner',
  ];

  targets.forEach(selector => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.classList.add('fade-in');
      if (i > 0 && i <= 4) el.classList.add(`fade-in-delay-${i}`);
      observer.observe(el);
    });
  });

  // ヘッダー背景
  const onScroll = () => {
    header?.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── スムーススクロール (アンカーリンク) ── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ── ニュースレターフォーム ── */
function handleNewsletterSubmit(e) {
  e.preventDefault();
  const input = e.target.querySelector('.newsletter-input');
  if (!input?.value) return;
  showToast('ご登録ありがとうございます。物語の続きをお楽しみに。');
  input.value = '';
}

/* ── パーティクル (花びら) ── */
function initPetalAnimation() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const createPetal = () => {
    const petal = document.createElement('div');
    petal.style.cssText = `
      position: absolute;
      width: ${6 + Math.random() * 8}px;
      height: ${4 + Math.random() * 6}px;
      background: ${['#F4C8D8','#ECA0B8','#D4A0C0','#F8E4F0'][Math.floor(Math.random()*4)]};
      border-radius: 50% 0;
      left: ${Math.random() * 100}%;
      top: -20px;
      opacity: ${0.4 + Math.random() * 0.5};
      pointer-events: none;
      z-index: 6;
    `;

    hero.appendChild(petal);

    const duration = 6000 + Math.random() * 6000;
    const endX     = (Math.random() - 0.5) * 200;

    petal.animate([
      { transform: `translate(0, 0) rotate(0deg)`, opacity: petal.style.opacity },
      { transform: `translate(${endX * 0.4}px, 40vh) rotate(${Math.random() * 360}deg)`, opacity: petal.style.opacity },
      { transform: `translate(${endX}px, 100vh) rotate(${Math.random() * 720}deg)`, opacity: 0 },
    ], { duration, easing: 'ease-in', fill: 'forwards' })
    .finished.then(() => petal.remove());
  };

  // 定期的に花びら生成
  const interval = setInterval(createPetal, 1200);
  // 最初は数枚まとめて
  for (let i = 0; i < 5; i++) {
    setTimeout(createPetal, i * 300);
  }

  // ページから離れたら停止
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInterval(interval);
  });
}

/* ── 地図グラフィック (region) のホバー効果 ── */
function initRegionHover() {
  document.querySelectorAll('.region-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const icon = card.querySelector('.region-icon svg');
      if (icon) {
        icon.style.transform = 'scale(1.12) rotate(3deg)';
        icon.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
      }
    });
    card.addEventListener('mouseleave', () => {
      const icon = card.querySelector('.region-icon svg');
      if (icon) {
        icon.style.transform = '';
      }
    });
  });
}

/* ── 数値カウントアップ ── */
function initCountUp() {
  const stats = document.querySelectorAll('.stat-number');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const text = el.innerHTML;
      // 数値部分を抽出
      const match = text.match(/^(\d+)/);
      if (!match) return;
      const end = parseInt(match[1]);
      if (isNaN(end)) return;

      let start = 0;
      const duration = 1400;
      const step = timestamp => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        // ease out
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * end);
        el.innerHTML = text.replace(/^\d+/, current);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  stats.forEach(el => observer.observe(el));
}

/* ── チェックアウトボタン ── */
function initCheckout() {
  const btn = document.querySelector('.btn-checkout');
  btn?.addEventListener('click', () => {
    if (cart.count === 0) return;
    showToast('この度のご注文、誠にありがとうございます。');
    // 実際のECでは決済ページへ遷移
  });
}

/* ── 初期化 ── */
document.addEventListener('DOMContentLoaded', () => {
  // カートの復元
  cart.load();
  cart.render();
  updateCartCount();

  // カートの開閉
  document.getElementById('cartBtn')?.addEventListener('click', openCart);
  document.getElementById('cartClose')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);

  // Escキーでカート閉じる
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeCart();
  });

  // 各機能の初期化
  initCategoryFilter();
  initAddToCartButtons();
  initScrollAnimations();
  initSmoothScroll();
  initPetalAnimation();
  initRegionHover();
  initCountUp();
  initCheckout();

  console.log('紀の物語 — Ki no Monogatari 起動完了');
});

// グローバルに公開 (インラインイベント用)
window.cart = cart;
window.handleNewsletterSubmit = handleNewsletterSubmit;
