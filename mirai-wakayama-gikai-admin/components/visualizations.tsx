import type { ReactNode } from "react";

/** 円形プログレス（使用率など） */
export function CircleProgress({
  value,
  max = 100,
  label,
  sub,
  size = 120,
  color = "var(--brand)",
}: {
  value: number;
  max?: number;
  label?: ReactNode;
  sub?: ReactNode;
  size?: number;
  color?: string;
}) {
  const r = size * 0.42;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;
  const ratio = Math.min(Math.max(value / max, 0), 1);
  const offset = c * (1 - ratio);
  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--surface-3)"
            strokeWidth={size * 0.1}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={size * 0.1}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 700ms ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display tabular-nums text-[--color-foreground]" style={{ fontSize: size * 0.22 }}>
            {Math.round((value / max) * 100)}
            <span className="text-[60%] ml-0.5">%</span>
          </div>
          {sub && <div className="text-[10px] text-[--color-faint] mt-0.5">{sub}</div>}
        </div>
      </div>
      {label && <div className="text-xs font-medium text-[--color-muted]">{label}</div>}
    </div>
  );
}

/** ドーナツチャート（経費種別ごとの構成比） */
export function DonutChart({
  data,
  size = 200,
  strokeWidth,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const sw = strokeWidth ?? size * 0.18;
  const r = (size - sw) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;

  if (total === 0) {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={sw} />
      </svg>
    );
  }

  let offset = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={sw} />
        {data.map((d, i) => {
          if (d.value === 0) return null;
          const len = c * (d.value / total);
          const dash = `${len} ${c - len}`;
          const seg = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={sw}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return seg;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-[10px] text-[--color-faint] tracking-wider uppercase">支出計</div>
        <div className="font-display tabular-nums text-base text-[--color-foreground]">
          ¥{total.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

/** 経費種別の凡例リスト */
export function CategoryLegend({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ul className="space-y-1 text-xs">
      {data.map((d, i) => {
        const ratio = total > 0 ? (d.value / total) * 100 : 0;
        return (
          <li key={i} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: d.color }}
            />
            <span className="text-[--color-foreground] truncate flex-1">{d.label}</span>
            <span className="font-display tabular-nums text-[--color-faint] text-[10px]">
              {ratio.toFixed(1)}%
            </span>
          </li>
        );
      })}
    </ul>
  );
}
