"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  group?: string;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Home",
    items: [{ href: "/", label: "ダッシュボード", icon: "🏠" }],
  },
  {
    title: "書類",
    items: [
      { href: "/forms/ledger/report", label: "収支報告書", icon: "📋" },
      { href: "/forms/ledger", label: "個人会計帳簿", icon: "📒" },
      { href: "/forms/payment-certificate", label: "支払証明書", icon: "🧾" },
      { href: "/forms/activity-record", label: "活動記録簿", icon: "📝" },
      { href: "/forms/activity-record/out-of-prefecture", label: "県外調査", icon: "✈" },
      { href: "/forms/vehicle-log", label: "自家用自動車使用簿", icon: "🚗" },
      { href: "/forms/receipt", label: "領収書", icon: "📑" },
    ],
  },
  {
    title: "取り込み",
    items: [
      { href: "/forms/import", label: "ファイル取り込み", icon: "📂" },
      { href: "/google-sync", label: "Google Drive 連携", icon: "☁" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem("sidebar-collapsed");
    if (v === "1") setCollapsed(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-full bg-white shadow-lg border border-[--color-border] flex items-center justify-center text-lg no-print"
        aria-label="メニューを開く"
      >
        ☰
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 no-print"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          no-print
          fixed top-0 left-0 z-50 h-screen
          transition-all duration-200 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          ${collapsed ? "lg:w-[76px]" : "lg:w-64"}
          w-72 flex flex-col
        `}
      >
        {/* Inner card with padding */}
        <div className="m-3 mr-0 lg:m-4 lg:mr-2 flex flex-col h-[calc(100vh-1.5rem)] lg:h-[calc(100vh-2rem)] rounded-3xl bg-white/90 backdrop-blur-md border border-[--color-border] shadow-[0_4px_24px_-12px_rgba(0,104,51,0.12)] overflow-hidden">
          {/* Logo / Title */}
          {collapsed ? (
            // 折りたたみ時: ロゴ中央 + 下に展開ボタン
            <div className="border-b border-[--color-border]/60 flex flex-col items-center gap-3 py-4">
              <Link
                href="/"
                className="w-10 h-10 rounded-2xl mirai-gradient flex items-center justify-center text-white text-xl shadow-sm"
                title="ホームへ"
              >
                🌱
              </Link>
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="hidden lg:inline-flex w-7 h-7 items-center justify-center rounded-full bg-[--color-surface-3] hover:bg-[--color-brand-soft] text-[--color-foreground] hover:text-[--color-brand] transition shadow-sm"
                aria-label="サイドバーを展開"
                title="展開する"
              >
                ›
              </button>
            </div>
          ) : (
            // 展開時: ロゴ + テキスト 左、折りたたみ／閉じる 右
            <div className="px-4 py-5 border-b border-[--color-border]/60 flex items-center justify-between gap-2">
              <Link href="/" className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-2xl mirai-gradient flex items-center justify-center text-white text-xl shrink-0 shadow-sm">
                  🌱
                </div>
                <div className="min-w-0">
                  <div className="font-display mirai-gradient-text text-sm leading-none">
                    Seimu Admin
                  </div>
                  <div className="text-[10px] text-[--color-faint] mt-1 truncate">
                    政務活動費 管理ツール
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="hidden lg:inline-flex w-7 h-7 items-center justify-center rounded-full bg-[--color-surface-3] hover:bg-[--color-brand-soft] text-[--color-foreground] hover:text-[--color-brand] transition"
                  aria-label="サイドバーを折りたたむ"
                  title="折りたたむ"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="lg:hidden w-7 h-7 inline-flex items-center justify-center rounded-full hover:bg-[--color-brand-soft] text-[--color-faint]"
                  aria-label="閉じる"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            {NAV_GROUPS.map((g) => (
              <div key={g.title}>
                {!collapsed && (
                  <div className="text-[10px] font-bold tracking-[0.18em] text-[--color-faint] uppercase mb-2 px-3">
                    {g.title}
                  </div>
                )}
                <ul className="space-y-1">
                  {g.items.map((it) => {
                    const active =
                      it.href === "/"
                        ? pathname === "/"
                        : pathname === it.href || pathname.startsWith(it.href + "/");
                    return (
                      <li key={it.href}>
                        <Link
                          href={it.href}
                          className={`
                            group relative flex items-center gap-3 rounded-2xl text-sm font-medium transition-all duration-150
                            ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}
                            ${
                              active
                                ? "bg-gradient-to-br from-[--color-brand] to-[--color-brand-mid] text-white shadow-[0_4px_14px_-6px_rgba(0,104,51,0.4)]"
                                : "text-[--color-foreground] hover:bg-[--color-brand-soft] hover:text-[--color-brand-deep]"
                            }
                          `}
                          title={collapsed ? it.label : undefined}
                        >
                          <span
                            className={`
                              shrink-0 w-7 h-7 rounded-xl flex items-center justify-center text-base transition
                              ${
                                active
                                  ? "bg-white/20 text-white"
                                  : "bg-[--color-surface-3] group-hover:bg-white text-[--color-foreground]"
                              }
                            `}
                          >
                            {it.icon}
                          </span>
                          {!collapsed && <span className="truncate">{it.label}</span>}
                          {!collapsed && active && (
                            <span className="ml-auto text-white/70 text-xs">●</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-3 py-3 border-t border-[--color-border]/60">
            {!collapsed ? (
              <form action="/api/auth" method="post">
                <input type="hidden" name="action" value="logout" />
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-medium text-[--color-faint] hover:bg-[--color-mirai-red-soft] hover:text-[--color-mirai-red] transition">
                  <span className="w-7 h-7 rounded-xl bg-[--color-surface-3] flex items-center justify-center">
                    ⏏
                  </span>
                  <span>ログアウト</span>
                </button>
              </form>
            ) : (
              <form action="/api/auth" method="post" className="flex justify-center">
                <input type="hidden" name="action" value="logout" />
                <button
                  className="w-9 h-9 rounded-xl bg-[--color-surface-3] flex items-center justify-center text-[--color-faint] hover:bg-[--color-mirai-red-soft] hover:text-[--color-mirai-red] transition"
                  title="ログアウト"
                >
                  ⏏
                </button>
              </form>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export function SidebarLayoutShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const update = () => {
      setCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
    };
    update();
    window.addEventListener("storage", update);
    const id = setInterval(update, 500);
    return () => {
      window.removeEventListener("storage", update);
      clearInterval(id);
    };
  }, []);
  return (
    <div className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
      {children}
    </div>
  );
}
