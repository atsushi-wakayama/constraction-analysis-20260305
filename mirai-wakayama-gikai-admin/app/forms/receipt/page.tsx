import Link from "next/link";
import { getActiveYear } from "@/lib/active-year";
import { listReceiptsByYear } from "@/lib/storage";
import { EmptyState, PageHeader, Pill } from "@/components/ui";
import type { Receipt } from "@/lib/types";

export const dynamic = "force-dynamic";

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

function group(list: Receipt[]): Map<string, Receipt[]> {
  const m = new Map<string, Receipt[]>();
  for (const r of list) {
    const k = r.category || "未分類";
    const arr = m.get(k) ?? [];
    arr.push(r);
    m.set(k, arr);
  }
  return m;
}

export default async function ReceiptListPage() {
  const year = await getActiveYear();
  const list = await listReceiptsByYear(year);
  const byCat = group(list);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <PageHeader
        breadcrumb={[
          { href: "/", label: "ダッシュボード" },
          { href: "/forms/receipt", label: "領収書" },
        ]}
        title={
          <>
            <span className="font-display mirai-gradient-text mr-2">{year}</span>
            年度の領収書
          </>
        }
        description="経費種別ごとにまとめて閲覧・印刷できます。PDFは自動的にページ単位の画像になります。"
        actions={
          <Link href="/forms/receipt/upload" className="btn btn-mint">
            + アップロード
          </Link>
        }
      />

      {list.length === 0 ? (
        <EmptyState
          title="まだ領収書がありません"
          hint="「+ アップロード」からPDFまたは画像を登録してください。"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(byCat.entries()).map(([cat, items]) => {
            const totalSum = items.reduce((s, r) => s + (r.totalYen || 0), 0);
            const allocSum = items.reduce((s, r) => s + (r.allocatedYen || 0), 0);
            const previews = items.slice(0, 3);
            return (
              <Link
                key={cat}
                href={`/forms/receipt/category/${encodeURIComponent(cat)}`}
                className="block app-card app-card-hover overflow-hidden"
              >
                <header className="px-4 py-3 border-b border-[--color-border] flex items-baseline justify-between">
                  <h2 className="font-bold text-[--color-foreground]">{cat}</h2>
                  <Pill tone="mint">{items.length} 枚</Pill>
                </header>
                <div className="grid grid-cols-3 gap-1 p-3 bg-[--color-surface-2]/50">
                  {previews.map((r) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={r.id}
                      src={`/api/receipts/${r.imageFile}`}
                      alt=""
                      className="w-full h-24 object-contain bg-white border border-[--color-border]"
                    />
                  ))}
                  {Array.from({ length: Math.max(0, 3 - previews.length) }).map((_, i) => (
                    <div key={i} className="h-24 bg-white border border-[--color-border]" />
                  ))}
                </div>
                <div className="px-4 py-3 text-xs flex justify-between border-t border-[--color-border]">
                  <span className="text-[--color-muted]">
                    総 <span className="font-medium text-[--color-foreground]">{yen(totalSum)}</span>
                  </span>
                  <span className="text-[--color-muted]">
                    充当 <span className="font-medium text-[--color-foreground]">{yen(allocSum)}</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
