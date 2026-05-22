# ウバメガシの里プロジェクト

和歌山県日高川町の耕作放棄地10ヘクタールをウバメガシの森に再生し、50年後の後世に「ウバメガシの里」を手渡すための、ふるさと納税型クラウドファンディングのランディングページ。

- 単一ファイル（`index.html`）の静的サイト
- 外部依存なし（CDN・APIなし）
- スマホ完全対応

## ローカルで開く

```bash
# 単に開くだけなら
open index.html   # macOS
xdg-open index.html  # Linux

# もしくは簡易サーバ
python3 -m http.server 3000
# → http://localhost:3000
```

## Vercelへデプロイ

### 方法1：Vercel CLI（推奨・最短）

```bash
npm i -g vercel        # 初回のみ
cd ubamegashi-crowdfunding
vercel login           # 初回のみ（メール認証）
vercel --prod
```

`vercel --prod` を実行するだけで本番URLが発行されます。

### 方法2：GitHub連携

1. https://vercel.com/new を開く
2. このリポジトリをインポート
3. **Root Directory** に `ubamegashi-crowdfunding` を指定
4. **Framework Preset** は `Other`
5. Deploy を押す

以降、`main` ブランチへのpushで自動デプロイされます。
