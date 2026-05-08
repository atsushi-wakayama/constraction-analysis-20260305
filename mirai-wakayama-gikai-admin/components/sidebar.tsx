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
    title: "ダッシュボード",
    items: [{ href: "/", label: "ダッシュボード", icon: "▶" }],
  },
  {
    title: "書類",
    items: [
      { href: "/forms/ledger/report", label: "① 収支報告書", icon: "📋" },
      { href: "/forms/ledger", label: "② 個人会計帳簿", icon: "📒" },
      { href: "/forms/payment-certificate/new", label: "③ 支払証明書（新規）", icon: "🧾" },
      { href: "/forms/activity-record", label: "④ 活動記録簿", icon: "📝" },
      { href: "/forms/activity-record/out-of-prefecture", label: "　└ 県外調査", icon: "✈" },
      { href: "/forms/vehicle-log", label: "⑤ 自家用自動車使用簿", icon: "🚗" },
      { href: "/forms/receipt", label: "⑥ 領収書", icon: "📑" },
    ],
  },
  {
    title: "連携",
    items: [
      { href: "/google-sync", label: "Google Drive 連携", icon: "☁" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop collapse

  // localStorage で折りたたみ状態を保持
  useEffect(() => {
    const v = localStorage.getItem("sidebar-collapsed");
    if (v === "1") setCollapsed(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // ルート遷移時にモバイルドロワー閉じる
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 btn btn-secondary btn-sm shadow-md no-print"
        aria-label="メニューを開く"
      >
        ☰
      </button>

      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 no-print"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          no-print
          fixed top-0 left-0 z-50 h-screen
          bg-white border-r border-[--color-border]
          transition-all duration-200 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          ${collapsed ? "lg:w-16" : "lg:w-60"}
          w-72 flex flex-col overflow-hidden
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[--color-border]">
          {!collapsed && (
            <Link href="/" className="font-display mirai-gradient-text text-lg leading-none truncate">
              Admin
            </Link>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="hidden lg:inline-flex w-7 h-7 items-center justify-center rounded hover:bg-[--color-surface-2] text-[--color-faint]"
              aria-label="サイドバーを折りたたむ"
              title={collapsed ? "展開" : "折りたたむ"}
            >
              {collapsed ? "›" : "‹"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="lg:hidden w-7 h-7 inline-flex items-center justify-center rounded hover:bg-[--color-surface-2] text-[--color-faint]"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {NAV_GROUPS.map((g) => (
            <div key={g.title}>
              {!collapsed && (
                <div className="text-[10px] font-semibold tracking-[0.12em] text-[--color-faint] uppercase mb-1.5 px-2">
                  {g.title}
                </div>
              )}
              <ul className="space-y-0.5">
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
                          flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition
                          ${
                            active
                              ? "bg-[--color-brand-soft] text-[--color-brand-deep] font-bold"
                              : "text-[--color-foreground] hover:bg-[--color-surface-2]"
                          }
                          ${collapsed ? "justify-center" : ""}
                        `}
                        title={collapsed ? it.label : undefined}
                      >
                        <span className="shrink-0 text-base leading-none">{it.icon}</span>
                        {!collapsed && <span className="truncate">{it.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-3 border-t border-[--color-border] text-[10px] text-[--color-faint]">
            <form action="/api/auth" method="post">
              <input type="hidden" name="action" value="logout" />
              <button className="btn btn-ghost btn-sm w-full justify-start">
                ログアウト
              </button>
            </form>
          </div>
        )}
      </aside>
    </>
  );
}

// 主コンテンツのラッパ。サイドバーとセットで使う
export function SidebarLayoutShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const update = () => {
      setCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
    };
    update();
    window.addEventListener("storage", update);
    const id = setInterval(update, 500); // 同タブ内変化用
    return () => {
      window.removeEventListener("storage", update);
      clearInterval(id);
    };
  }, []);
  return (
    <div className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-16" : "lg:pl-60"}`}>
      {children}
    </div>
  );
}
