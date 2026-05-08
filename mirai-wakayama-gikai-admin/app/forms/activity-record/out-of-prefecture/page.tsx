import Link from "next/link";
import { getActiveYear } from "@/lib/active-year";
import {
  listOutOfPrefectureByYear,
  listReceiptsByYear,
  listCertificatesByYear,
} from "@/lib/storage";
import { EmptyState, PageHeader, Pill } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function OutOfPrefecturePage() {
  const year = await getActiveYear();
  const [records, receipts, certs] = await Promise.all([
    listOutOfPrefectureByYear(year),
    listReceiptsByYear(year),
    listCertificatesByYear(year),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <PageHeader
        breadcrumb={[
          { href: "/", label: "ダッシュボード" },
          { href: "/forms/activity-record", label: "活動記録簿" },
          { href: "#", label: "県外調査" },
        ]}
        title={
          <>
            県外調査
            <span className="font-display mirai-gradient-text ml-2">{year}</span>
            <span className="text-xl ml-1">年度</span>
          </>
        }
        description="県外調査として印を付けた活動記録の一覧。各調査ごとに支払証明書・領収書をまとめて管理します。"
      />

      <div className="app-card p-4 text-xs text-[--color-muted] bg-[--color-brand-soft]/50 border-l-4 border-l-[--color-brand]">
        <span className="font-medium">📌 ヒント</span>: 活動記録の編集画面で「県外調査として管理する」にチェックを入れると、ここに表示されます。
      </div>

      {records.length === 0 ? (
        <EmptyState
          title="県外調査として登録された記録はありません"
          hint="活動記録の編集画面でチェックを入れると、ここに表示されます。"
          action={
            <Link href="/forms/activity-record" className="btn btn-secondary btn-sm">
              活動記録簿へ
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {records.map((rec) => {
            const linkedReceipts = receipts.filter((r) =>
              (rec.linkedReceiptIds ?? []).includes(r.id),
            );
            const expensesByCategory = new Map<string, number>();
            for (const e of rec.expenses) {
              expensesByCategory.set(
                e.category,
                (expensesByCategory.get(e.category) ?? 0) + (e.allocatedYen || 0),
              );
            }
            return (
              <section key={rec.id} className="app-card p-5 space-y-3">
                <header className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Pill tone="orange">県外調査</Pill>
                      <span className="font-display tabular-nums text-[--color-foreground]">
                        {rec.implementationDate || "(未設定)"}
                      </span>
                      <span className="text-[--color-faint]">·</span>
                      <span className="text-sm">{rec.location || "(場所未設定)"}</span>
                    </div>
                    <p className="text-xs text-[--color-muted] mt-1 line-clamp-2 max-w-2xl">
                      {rec.purposeContent.slice(0, 120)}
                      {rec.purposeContent.length > 120 ? "…" : ""}
                    </p>
                  </div>
                  <Link
                    href={`/forms/activity-record/${rec.id}`}
                    className="btn btn-mint btn-sm"
                  >
                    詳細・編集 →
                  </Link>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="border border-[--color-border] rounded-lg p-3">
                    <div className="text-xs text-[--color-faint] mb-1">📝 活動記録</div>
                    <div className="text-sm">参加者: {rec.participants || "—"}</div>
                  </div>
                  <div className="border border-[--color-border] rounded-lg p-3">
                    <div className="text-xs text-[--color-faint] mb-1">🧾 支払（経費種別ごと）</div>
                    {expensesByCategory.size === 0 ? (
                      <div className="text-xs text-[--color-faint]">未入力</div>
                    ) : (
                      <ul className="text-xs space-y-0.5">
                        {Array.from(expensesByCategory).map(([c, v]) => (
                          <li key={c} className="flex justify-between">
                            <span>{c}</span>
                            <span className="font-display tabular-nums">¥{v.toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="border border-[--color-border] rounded-lg p-3">
                    <div className="text-xs text-[--color-faint] mb-1">📑 リンク済み領収書</div>
                    {linkedReceipts.length === 0 ? (
                      <div className="text-xs text-[--color-faint]">
                        未リンク
                        <br />
                        <span className="text-[10px]">
                          領収書ページで紐付けるとここに表示
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-1">
                        {linkedReceipts.slice(0, 6).map((r) => (
                          <Link
                            key={r.id}
                            href={`/forms/receipt/${r.id}`}
                            className="block border border-[--color-border] rounded overflow-hidden bg-white hover:shadow-sm"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/api/receipts/${r.imageFile}`}
                              alt=""
                              className="w-full h-12 object-contain bg-[--color-surface-2]"
                            />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
