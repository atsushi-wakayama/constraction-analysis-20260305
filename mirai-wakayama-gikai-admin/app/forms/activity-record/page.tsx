import Link from "next/link";
import { listActivitiesByYear } from "@/lib/storage";
import { getActiveYear } from "@/lib/active-year";
import { EmptyState, PageHeader, Pill } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ActivityRecordListPage() {
  const year = await getActiveYear();
  const records = await listActivitiesByYear(year);
  const totalAlloc = records.reduce(
    (s, r) => s + r.expenses.reduce((sub, e) => sub + (e.allocatedYen || 0), 0),
    0,
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <PageHeader
        breadcrumb={[
          { href: "/", label: "ダッシュボード" },
          { href: "/forms/activity-record", label: "活動記録簿" },
        ]}
        title={
          <>
            活動記録簿
            <span className="font-display mirai-gradient-text ml-2">{year}</span>
            <span className="text-xl ml-1">年度</span>
          </>
        }
        description={`参考様式4 ・ 全 ${records.length}件 ・ 政務活動費充当合計 ¥${totalAlloc.toLocaleString()}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/forms/activity-record/new" className="btn btn-secondary btn-sm">
              + 新規作成
            </Link>
            <Link href="/forms/activity-record/all" className="btn btn-mint">
              📑 まとめて編集・印刷
            </Link>
          </div>
        }
      />

      {records.length === 0 ? (
        <EmptyState
          title="この年度の活動記録はまだありません"
          hint="「+ 新規作成」または「ファイル取り込み」から登録できます。"
          action={
            <Link href="/forms/activity-record/new" className="btn btn-mint btn-sm">
              + 新規作成
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {records.map((r, i) => (
            <li key={r.id}>
              <Link
                href={`/forms/activity-record/${r.id}`}
                className="block app-card app-card-hover p-4"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[10px] text-[--color-faint] font-display tabular-nums">
                        #{i + 1}
                      </span>
                      <span className="font-display tabular-nums text-[--color-foreground]">
                        {r.implementationDate || "(日付未設定)"}
                      </span>
                      {r.outOfPrefecture && <Pill tone="orange">県外調査</Pill>}
                    </div>
                    <div className="text-sm font-medium mt-0.5 truncate">
                      📍 {r.location || "(場所未設定)"}
                    </div>
                    <div className="text-xs text-[--color-muted] mt-1 line-clamp-2 leading-relaxed">
                      {r.purposeContent.slice(0, 100) || "—"}
                      {r.purposeContent.length > 100 ? "…" : ""}
                    </div>
                    {r.expenses.length > 0 && (
                      <div className="text-[11px] text-[--color-faint] mt-1.5">
                        支出 {r.expenses.length}件 · 政務活動充当 ¥
                        {r.expenses
                          .reduce((s, e) => s + (e.allocatedYen || 0), 0)
                          .toLocaleString()}
                      </div>
                    )}
                  </div>
                  <span className="btn btn-ghost btn-sm shrink-0">単独編集 →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
