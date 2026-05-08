import Link from "next/link";
import { getActiveYear } from "@/lib/active-year";
import { listReceiptsByYearAndCategory } from "@/lib/storage";
import { PrintButton } from "@/components/print-button";
import { EmptyState, PageHeader, Pill, StatTile } from "@/components/ui";

export const dynamic = "force-dynamic";

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

type Props = { params: Promise<{ name: string }> };

export default async function ReceiptCategoryPage({ params }: Props) {
  const { name } = await params;
  const category = decodeURIComponent(name);
  const year = await getActiveYear();
  const list = await listReceiptsByYearAndCategory(year, category);

  const totalSum = list.reduce((s, r) => s + (r.totalYen || 0), 0);
  const allocSum = list.reduce((s, r) => s + (r.allocatedYen || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <PageHeader
        breadcrumb={[
          { href: "/", label: "ダッシュボード" },
          { href: "/forms/receipt", label: "領収書" },
          { href: "#", label: category },
        ]}
        title={
          <>
            {category}
            <Pill tone="mint">{list.length}枚</Pill>
          </>
        }
        description={`${year}年度の${category}領収書一覧。各領収書1ページずつ印刷されます。`}
        actions={<PrintButton label={`${category}を印刷`} />}
      />

      {list.length > 0 && (
        <section className="grid grid-cols-2 md:grid-cols-3 gap-3 no-print">
          <StatTile label="枚数" value={`${list.length}`} />
          <StatTile label="総経費" value={yen(totalSum)} />
          <StatTile label="政務活動費充当" value={yen(allocSum)} tone="mint" />
        </section>
      )}

      {list.length === 0 ? (
        <EmptyState
          title="このカテゴリの領収書はまだありません"
          hint="トップから「+ アップロード」で登録できます。"
        />
      ) : (
        <div className="space-y-6">
          {list.map((r, i) => (
            <article
              key={r.id}
              className="print-page app-card p-5 print:rounded-none print:border-0 print:p-0"
            >
              <div className="flex items-baseline justify-between text-xs mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm">{category}</span>
                  <span className="text-[--color-faint]">
                    {year}年度 / {i + 1} / {list.length} 枚目
                  </span>
                </div>
                <div className="text-[--color-faint]">
                  {r.sourcePdf ? `${r.sourcePdf} p.${r.pageNumber}` : ""}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4 items-start">
                <div className="bg-[--color-surface-3] rounded-lg flex items-center justify-center p-2 print:bg-white print:p-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/receipts/${r.imageFile}`}
                    alt={r.payee || "領収書"}
                    className="max-w-full max-h-[230mm] object-contain bg-white rounded"
                  />
                </div>
                <dl className="text-xs space-y-2">
                  <div>
                    <dt className="text-[--color-faint]">日付</dt>
                    <dd className="font-display text-base tabular-nums">{r.date || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[--color-faint]">支払先</dt>
                    <dd className="font-medium">{r.payee || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[--color-faint]">支払総額</dt>
                    <dd className="font-display tabular-nums">{yen(r.totalYen || 0)}</dd>
                  </div>
                  <div>
                    <dt className="text-[--color-faint]">政務活動費充当</dt>
                    <dd className="font-display tabular-nums text-[--color-mirai-mint-deep] font-bold">
                      {yen(r.allocatedYen || 0)}
                    </dd>
                  </div>
                  {r.description && (
                    <div>
                      <dt className="text-[--color-faint]">摘要</dt>
                      <dd className="whitespace-pre-wrap">{r.description}</dd>
                    </div>
                  )}
                  {r.note && (
                    <div>
                      <dt className="text-[--color-faint]">備考</dt>
                      <dd className="whitespace-pre-wrap">{r.note}</dd>
                    </div>
                  )}
                  <div className="pt-2 no-print">
                    <Link href={`/forms/receipt/${r.id}`} className="btn btn-ghost btn-sm">
                      編集する →
                    </Link>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
