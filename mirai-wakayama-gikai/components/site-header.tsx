import Link from "next/link";
import { Landmark } from "lucide-react";

const nav = [
  { href: "/", label: "トップ" },
  { href: "/members", label: "議員を探す" },
  { href: "/#schedule", label: "議会日程" },
  { href: "/#budget", label: "予算" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-wakayama-orange to-wakayama-orange-dark text-white shadow-sm">
            <Landmark size={18} strokeWidth={2.25} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-xs text-wakayama-blue-dark font-semibold tracking-wider">
              MIRAI NO
            </span>
            <span className="text-base font-bold text-slate-900 -mt-0.5 group-hover:text-wakayama-orange transition-colors">
              みらいのわかやま県議会
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-sm text-slate-700 hover:text-wakayama-orange transition-colors rounded-md"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
