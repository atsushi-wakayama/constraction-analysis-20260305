import Link from "next/link";
import { getActiveYear } from "@/lib/active-year";
import {
  listActivitiesByYear,
  listCertificatesByYear,
} from "@/lib/storage";
import { CertOutOfPrefGroup } from "@/components/cert-out-of-pref-group";
import { EmptyState, PageHeader, Pill } from "@/components/ui";

export const dynamic = "force-dynamic";

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

export default async function PaymentCertListPage() {
  const year = await getActiveYear();
  const [certs, activities] = await Promise.all([
    listCertificatesByYear(year),
    listActivitiesByYear(year),
  ]);

  const regularCerts = certs.filter((c) => !c.linkedActivityId);
  const outOfPrefCerts = certs.filter((c) => !!c.linkedActivityId);
  const totalSum = certs.reduce(
    (s, c) => s + c.entries.reduce((sub, e) => sub + (e.allocatedYen || 0), 0),
    0,
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <PageHeader
        breadcrumb={[
          { href: "/", label: "ダッシュボード" },
          { href: "/forms/payment-certificate", label: "支払証明書" },
        ]}
        title={
          <>
            支払証明書
            <span className="font-display mirai-gradient-text ml-2">{year}</span>
            <span className="text-xl ml-1">年度</span>
          </>
        }
        description={`別記第7号様式 · 全 ${certs.length}件 · 充当合計 ${yen(totalSum)}`}
        actions={
          <Link href="/forms/payment-certificate/new" className="btn btn-mint">
            + 新規作成
          </Link>
        }
      />

      {certs.length === 0 ? (
        <EmptyState
          title="この年度の支払証明書はまだありません"
          hint="自動車使用簿の月別ページから自動生成、または「+ 新規作成」から作れます。"
        />
      ) : (
        <div className="space-y-5">
          {/* 通常の支払証明書 */}
          {regularCerts.length > 0 && (
            <section className="app-card p-5">
              <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5">
                <span>📑</span>
                <span>通常の支払証明書</span>
                <span className="text-[--color-faint] font-normal text-xs">
                  {regularCerts.length}件
                </span>
              </h2>
              <ul className="divide-y divide-[--color-border]">
                {regularCerts.map((c) => {
                  const total = c.entries.reduce(
                    (s, e) => s + (e.allocatedYen || 0),
                    0,
                  );
                  return (
                    <li
                      key={c.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <Link
                        href={`/forms/payment-certificate/${c.id}`}
                        className="flex-1 min-w-0 hover:text-[--color-brand] group"
                      >
                        <div className="text-sm font-bold flex items-center gap-2 flex-wrap group-hover:underline">
                          <span>{c.category}</span>
                          {c.sourceKey?.startsWith("vehicle:") && (
                            <Pill tone="mint">自動車使用簿から生成</Pill>
                          )}
                        </div>
                        <div className="text-xs text-[--color-faint]">
                          {c.entries.length}件 · 充当{" "}
                          <span className="font-display tabular-nums text-[--color-foreground]">
                            {yen(total)}
                          </span>
                          {c.certifiedDate && ` · 証明日 ${c.certifiedDate}`}
                        </div>
                      </Link>
                      <Link
                        href={`/forms/payment-certificate/${c.id}`}
                        className="btn btn-ghost btn-sm"
                      >
                        編集 / 印刷 →
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* 県外調査グループ（折りたたみ可能） */}
          {outOfPrefCerts.length > 0 && (
            <CertOutOfPrefGroup certs={outOfPrefCerts} activities={activities} />
          )}
        </div>
      )}
    </div>
  );
}
