import { notFound } from "next/navigation";
import { getReceipt } from "@/lib/storage";
import { ReceiptEditor } from "@/components/receipt-editor";
import { PageHeader, Pill } from "@/components/ui";
import { deleteReceiptAction, updateReceiptAction } from "../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ReceiptEditPage({ params }: Props) {
  const { id } = await params;
  const r = await getReceipt(id);
  if (!r) notFound();

  const update = async (form: FormData) => {
    "use server";
    await updateReceiptAction(id, form);
  };
  const remove = async () => {
    "use server";
    await deleteReceiptAction(id);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <PageHeader
        breadcrumb={[
          { href: "/", label: "ダッシュボード" },
          { href: "/forms/receipt", label: "領収書" },
          {
            href: `/forms/receipt/category/${encodeURIComponent(r.category)}`,
            label: r.category,
          },
        ]}
        title={
          <>
            領収書詳細
            <Pill tone="mint">{r.category}</Pill>
            {r.sourcePdf && (
              <Pill tone="muted">
                {r.sourcePdf}
                {r.pageNumber ? ` p.${r.pageNumber}` : ""}
              </Pill>
            )}
          </>
        }
        actions={
          <a
            href={`/api/receipts/${r.imageFile}`}
            target="_blank"
            rel="noopener"
            className="btn btn-secondary btn-sm"
          >
            画像を別タブで開く
          </a>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="app-card overflow-hidden bg-[--color-surface-3] flex items-center justify-center p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/receipts/${r.imageFile}`}
            alt={r.payee || "領収書"}
            className="max-w-full max-h-[80vh] object-contain bg-white rounded-lg"
          />
        </div>
        <div className="app-card p-6">
          <ReceiptEditor initial={r} action={update} onDelete={remove} />
        </div>
      </div>
    </div>
  );
}
