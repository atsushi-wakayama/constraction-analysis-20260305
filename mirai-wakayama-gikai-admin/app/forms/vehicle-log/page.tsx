import Link from "next/link";
import { getActiveYear } from "@/lib/active-year";
import { listVehicleTripsByYear } from "@/lib/storage";
import { PageHeader, Pill } from "@/components/ui";

export const dynamic = "force-dynamic";

// 会計年度: 4月〜翌3月
const FISCAL_MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

export default async function VehicleLogIndexPage() {
  const year = await getActiveYear();
  const trips = await listVehicleTripsByYear(year);
  const counts = new Map<number, { count: number; km: number }>();
  for (const t of trips) {
    const cur = counts.get(t.month) ?? { count: 0, km: 0 };
    cur.count += 1;
    cur.km += Number(t.businessKm) || 0;
    counts.set(t.month, cur);
  }
  const totalKm = trips.reduce((s, t) => s + (t.businessKm || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <PageHeader
        breadcrumb={[
          { href: "/", label: "ダッシュボード" },
          { href: "/forms/vehicle-log", label: "自家用自動車使用簿" },
        ]}
        title={
          <>
            自家用自動車使用簿
            <span className="font-display mirai-gradient-text ml-2">{year}</span>
            <span className="text-xl ml-1">年度</span>
          </>
        }
        description={`参考様式3 ・ 全 ${trips.length}件 / ${totalKm.toFixed(1)}km。各月の編集画面で「支払証明書を再生成」を押すと、その月の trip から経費種別ごとの支払証明書を生成します（同月・同種別の自動生成済みは置換）。`}
      />

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {FISCAL_MONTHS.map((m) => {
          const c = counts.get(m);
          const filled = !!c;
          return (
            <Link
              key={m}
              href={`/forms/vehicle-log/${m}`}
              className="block app-card app-card-hover p-4"
            >
              <div className="font-display text-3xl mirai-gradient-text">
                {m}<span className="text-base text-[--color-foreground] ml-0.5">月</span>
              </div>
              <div className="mt-2">
                {filled ? (
                  <div className="text-xs text-[--color-muted]">
                    <Pill tone="mint">{c.count}件</Pill>
                    <span className="block mt-1 font-display tabular-nums text-sm text-[--color-foreground]">
                      {c.km.toFixed(1)}<span className="text-[--color-faint] text-xs ml-0.5">km</span>
                    </span>
                  </div>
                ) : (
                  <Pill tone="muted">未入力</Pill>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
