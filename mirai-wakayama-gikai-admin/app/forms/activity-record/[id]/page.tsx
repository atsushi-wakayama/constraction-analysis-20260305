import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getActivity,
  listActivitiesByYear,
  listCertificatesByActivity,
  listReceiptsByActivity,
} from "@/lib/storage";
import { ActivityRecordEditor } from "@/components/activity-record-editor";
import { ActivityRecordPrintView } from "@/components/activity-record-print-view";
import { EmptyState, PageHeader, Pill } from "@/components/ui";
import {
  createActivityAction,
  deleteActivityAction,
  updateActivityAction,
} from "../actions";

export const dynamic = "force-dynamic";

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

type Props = { params: Promise<{ id: string }> };

export default async function ActivityRecordEditPage({ params }: Props) {
  const { id } = await params;
  const isNew = id === "new";
  const rec = isNew ? null : await getActivity(id);
  if (!isNew && !rec) notFound();

  const [linkedCerts, linkedReceipts, siblings] = isNew
    ? [[], [], []]
    : await Promise.all([
        listCertificatesByActivity(id),
        listReceiptsByActivity(id),
        rec ? listActivitiesByYear(rec.fiscalYear) : Promise.resolve([]),
      ]);

  const idx = siblings.findIndex((a) => a.id === id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const action = isNew
    ? createActivityAction
    : async (form: FormData) => {
        "use server";
        await updateActivityAction(id, form);
      };

  const onDelete = isNew
    ? undefined
    : async () => {
        "use server";
        await deleteActivityAction(id);
      };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <PageHeader
        breadcrumb={[
          { href: "/", label: "ダッシュボード" },
          { href: "/forms/activity-record", label: "活動記録簿" },
          { href: "#", label: isNew ? "新規作成" : "単独編集" },
        ]}
        title={
          <>
            活動記録簿
            {isNew && <Pill tone="mint">新規作成</Pill>}
            {!isNew && rec?.outOfPrefecture && <Pill tone="orange">県外調査</Pill>}
          </>
        }
        description="参考様式4。視察や研修などの活動内容を記録します。県外調査の場合は支払証明書・領収書を紐付けて1セットで管理できます。"
        actions={
          rec ? (
            <div className="flex items-center gap-2">
              {prev ? (
                <Link
                  href={`/forms/activity-record/${prev.id}`}
                  className="btn btn-secondary btn-sm"
                  title={`${prev.implementationDate} · ${prev.location}`}
                >
                  ← 前
                </Link>
              ) : (
                <button
                  className="btn btn-secondary btn-sm opacity-40 cursor-not-allowed"
                  disabled
                  type="button"
                >
                  ← 前
                </button>
              )}
              <span className="text-xs text-[--color-faint] tabular-nums">
                {idx + 1} / {siblings.length}
              </span>
              {next ? (
                <Link
                  href={`/forms/activity-record/${next.id}`}
                  className="btn btn-secondary btn-sm"
                  title={`${next.implementationDate} · ${next.location}`}
                >
                  次 →
                </Link>
              ) : (
                <button
                  className="btn btn-secondary btn-sm opacity-40 cursor-not-allowed"
                  disabled
                  type="button"
                >
                  次 →
                </button>
              )}
            </div>
          ) : undefined
        }
      />

      <ActivityRecordEditor initial={rec} action={action} onDelete={onDelete} />

      {/* ===== 紐付けセクション（既存記録のみ） ===== */}
      {rec && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 no-print">
          {/* 県外調査の支払証明書 */}
          <div className="app-card p-5">
            <header className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <div className="section-title">
                <span>🧾 紐付けの支払証明書</span>
                <small>{linkedCerts.length}件</small>
              </div>
              <Link
                href={`/forms/payment-certificate/new?linkedActivityId=${rec.id}`}
                className="btn btn-mint btn-sm"
              >
                + 新規作成
              </Link>
            </header>
            {linkedCerts.length === 0 ? (
              <EmptyState
                title="まだ紐付けられた支払証明書はありません"
                hint="この活動記録専用の支払証明書を作成すると、ここにまとまります。"
              />
            ) : (
              <ul className="divide-y divide-[--color-border]">
                {linkedCerts.map((c) => {
                  const total = c.entries.reduce(
                    (s, e) => s + (e.allocatedYen || 0),
                    0,
                  );
                  return (
                    <li
                      key={c.id}
                      className="py-2.5 flex items-center justify-between gap-3"
                    >
                      <Link
                        href={`/forms/payment-certificate/${c.id}`}
                        className="flex-1 hover:text-[--color-brand]"
                      >
                        <div className="text-sm font-bold">{c.category}</div>
                        <div className="text-xs text-[--color-faint]">
                          {c.entries.length}件 · 充当{" "}
                          <span className="font-display tabular-nums">
                            {yen(total)}
                          </span>
                        </div>
                      </Link>
                      <Link
                        href={`/forms/payment-certificate/${c.id}`}
                        className="btn btn-ghost btn-sm"
                      >
                        編集 →
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* 県外調査の領収書 */}
          <div className="app-card p-5">
            <header className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <div className="section-title">
                <span>📑 紐付けの領収書</span>
                <small>{linkedReceipts.length}枚</small>
              </div>
              <Link
                href={`/forms/receipt/upload?linkedActivityId=${rec.id}`}
                className="btn btn-mint btn-sm"
              >
                + アップロード
              </Link>
            </header>
            {linkedReceipts.length === 0 ? (
              <EmptyState
                title="まだ紐付けられた領収書はありません"
                hint="アップロードすると自動的にこの活動記録に紐付きます。"
              />
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {linkedReceipts.map((r) => (
                  <Link
                    key={r.id}
                    href={`/forms/receipt/${r.id}`}
                    className="block app-card app-card-hover overflow-hidden rounded-lg"
                    title={`${r.category} ${r.date || ""} ${yen(r.totalYen || 0)}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/receipts/${r.imageFile}`}
                      alt=""
                      className="w-full h-24 object-contain bg-[--color-surface-2]"
                    />
                    <div className="px-2 py-1 text-[10px] text-[--color-muted] truncate">
                      {r.date || "(未設定)"} · {r.category}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {rec && (
        <section className="border-t border-[--color-border] pt-6">
          <p className="text-sm text-[--color-faint] mb-3 no-print">印刷プレビュー</p>
          <ActivityRecordPrintView rec={rec} />
        </section>
      )}
    </div>
  );
}
