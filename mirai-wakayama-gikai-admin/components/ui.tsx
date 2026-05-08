import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: {
  title: ReactNode;
  description?: string;
  breadcrumb?: { href: string; label: string }[];
  actions?: ReactNode;
}) {
  return (
    <header className="pb-5 mb-6 border-b border-[--color-border] no-print">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="text-xs text-[--color-faint] mb-2">
          {breadcrumb.map((b, i) => (
            <span key={b.href}>
              {i > 0 && <span className="mx-1.5">›</span>}
              <Link href={b.href} className="hover:text-[--color-mirai-mint-deep]">
                {b.label}
              </Link>
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-[--color-foreground]">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-[--color-muted] mt-1.5">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap">{actions}</div>
        )}
      </div>
    </header>
  );
}

export function StatTile({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "mint" | "orange" | "red" | "green";
}) {
  const cls =
    tone === "mint"
      ? "app-stat app-stat-mint"
      : "app-stat";
  return (
    <div className={cls}>
      <div className="app-stat-label">{label}</div>
      <div className="app-stat-value">{value}</div>
      {sub && (
        <div
          className={`app-stat-sub ${
            tone === "red"
              ? "text-[--color-mirai-red]"
              : tone === "orange"
              ? "text-[--color-mirai-orange-deep]"
              : tone === "green"
              ? "text-[--color-mirai-green-deep]"
              : ""
          }`}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  meta,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="app-card p-6 space-y-4">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="section-title">
            <span>{title}</span>
            {meta && <small>{meta}</small>}
          </div>
          {description && (
            <p className="text-xs text-[--color-faint] mt-1.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>
        )}
      </header>
      <div>{children}</div>
    </section>
  );
}

export function Pill({
  tone = "muted",
  children,
}: {
  tone?: "muted" | "mint" | "orange" | "red" | "green";
  children: ReactNode;
}) {
  return <span className={`app-pill app-pill-${tone}`}>{children}</span>;
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-10 px-4 border border-dashed border-[--color-border-strong] rounded-2xl bg-[--color-surface-2]">
      <p className="text-sm font-medium text-[--color-muted]">{title}</p>
      {hint && <p className="text-xs text-[--color-faint] mt-1.5">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function MetaLine({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[--color-faint] mt-2">
      {items.map((it, i) => (
        <div key={i} className="flex gap-1">
          <dt>{it.label}:</dt>
          <dd className="text-[--color-muted] font-medium">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
