import Link from "next/link";
import { getActiveYear } from "@/lib/active-year";
import { getActivity } from "@/lib/storage";
import { PageHeader, Pill } from "@/components/ui";
import { uploadReceiptAction } from "../actions";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  "調査研究費",
  "研修費",
  "広報広聴費",
  "会議費",
  "資料作成費",
  "資料購入費",
  "要請陳情活動費",
  "事務所費",
  "事務費",
  "人件費",
] as const;

type Props = { searchParams: Promise<{ linkedActivityId?: string }> };

export default async function ReceiptUploadPage({ searchParams }: Props) {
  const year = await getActiveYear();
  const { linkedActivityId } = await searchParams;
  const linkedAct = linkedActivityId ? await getActivity(linkedActivityId) : null;
  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <PageHeader
        breadcrumb={[
          { href: "/", label: "ダッシュボード" },
          { href: "/forms/receipt", label: "領収書" },
          { href: "/forms/receipt/upload", label: "アップロード" },
        ]}
        title={
          <>
            領収書をアップロード
            <span className="font-display mirai-gradient-text ml-2">{year}</span>
          </>
        }
        description="PDFは1ページ＝1領収書として自動分割されます。複数ページPDFをアップした場合は、各ページ個別にメタ情報を入力してください。"
      />
      {linkedAct && (
        <div className="app-card p-3 text-xs flex items-center justify-between gap-3 flex-wrap border-l-4 border-l-[--color-mirai-orange]">
          <div>
            <Pill tone="orange">県外調査と連携</Pill>
            <span className="ml-2 text-[--color-faint]">紐付け先：</span>
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

      <form
        action={uploadReceiptAction}
        encType="multipart/form-data"
        className="app-card p-6 space-y-5"
      >
        {linkedActivityId && (
          <input type="hidden" name="linkedActivityId" value={linkedActivityId} />
        )}
        <label className="block">
          <span className="text-sm font-medium">ファイル（PDF / JPEG / PNG）</span>
          <input
            type="file"
            name="file"
            accept="application/pdf,image/jpeg,image/png"
            required
            className="mt-1.5 w-full app-input bg-[--color-surface]"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">経費の種別</span>
          <select name="category" className="mt-1.5 w-full app-input" defaultValue="調査研究費">
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <div className="text-xs text-[--color-faint] bg-[--color-surface-3] rounded-lg p-3">
          以下のメタ情報は<strong className="text-[--color-foreground]">単一ページ</strong>の場合に保存されます。複数ページPDFは個別ページで入力してください。
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">日付</span>
            <input type="date" name="date" className="mt-1.5 w-full app-input" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">支払先</span>
            <input name="payee" className="mt-1.5 w-full app-input" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">支払総額(円)</span>
            <input type="number" name="totalYen" className="mt-1.5 w-full app-input" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">政務活動費充当額(円)</span>
            <input type="number" name="allocatedYen" className="mt-1.5 w-full app-input" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium">摘要・支払内容</span>
            <input name="description" className="mt-1.5 w-full app-input" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium">備考</span>
            <input name="note" className="mt-1.5 w-full app-input" />
          </label>
        </div>
        <button type="submit" className="btn btn-mint">
          アップロードして登録
        </button>
      </form>
    </div>
  );
}
