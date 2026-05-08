import Link from "next/link";
import { notFound } from "next/navigation";
import { getActivity, getCertificate } from "@/lib/storage";
import { PaymentFormEditor } from "@/components/payment-form-editor";
import { PaymentPrintView } from "@/components/payment-print-view";
import { PageHeader, Pill } from "@/components/ui";
import {
  createCertificateAction,
  deleteCertificateAction,
  updateCertificateAction,
} from "../actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ linkedActivityId?: string }>;
};

export default async function PaymentCertEditPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { linkedActivityId } = await searchParams;
  const isNew = id === "new";
  const cert = isNew ? null : await getCertificate(id);
  if (!isNew && !cert) notFound();

  const linkedAct = cert?.linkedActivityId
    ? await getActivity(cert.linkedActivityId)
    : linkedActivityId
    ? await getActivity(linkedActivityId)
    : null;

  const action = isNew
    ? createCertificateAction
    : async (form: FormData) => {
        "use server";
        await updateCertificateAction(id, form);
      };

  const onDelete = isNew
    ? undefined
    : async () => {
        "use server";
        await deleteCertificateAction(id);
      };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <PageHeader
        breadcrumb={[
          { href: "/", label: "ダッシュボード" },
          { href: "/", label: "支払証明書" },
        ]}
        title={
          <>
            支払証明書
            {isNew && <Pill tone="mint">新規作成</Pill>}
            {cert?.sourceKey?.startsWith("vehicle:") && (
              <Pill tone="mint">自動車使用簿から生成</Pill>
            )}
            {linkedAct && <Pill tone="orange">県外調査と連携中</Pill>}
          </>
        }
        description={
          isNew
            ? "別記第7号様式の支払証明書を作成します。経費種別と明細を入力してください。"
            : "経費種別ごとの明細を編集します。下部に印刷プレビューが表示されます。"
        }
      />

      {linkedAct && (
        <div className="app-card p-3 text-xs flex items-center justify-between gap-3 flex-wrap border-l-4 border-l-[--color-mirai-orange]">
          <div>
            <span className="text-[--color-faint]">紐付け先の活動記録：</span>
            <span className="font-bold">
              {linkedAct.implementationDate} · {linkedAct.location}
            </span>
          </div>
          <Link
            href={`/forms/activity-record/${linkedAct.id}`}
            className="btn btn-ghost btn-sm"
          >
            活動記録を開く →
          </Link>
        </div>
      )}

      <PaymentFormEditor
        initial={cert}
        action={action}
        onDelete={onDelete}
        linkedActivityId={cert?.linkedActivityId ?? linkedActivityId}
      />

      {cert && (
        <section className="border-t border-[--color-border] pt-6">
          <p className="text-sm text-[--color-faint] mb-3 no-print">印刷プレビュー</p>
          <PaymentPrintView cert={cert} />
        </section>
      )}
    </div>
  );
}
