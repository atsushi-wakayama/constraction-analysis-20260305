import { getActiveYear } from "@/lib/active-year";
import { ImportPanel } from "@/components/import-panel";
import { PageHeader } from "@/components/ui";
import { importFilesAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const year = await getActiveYear();
  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <PageHeader
        breadcrumb={[
          { href: "/", label: "ダッシュボード" },
          { href: "/forms/import", label: "ファイル取り込み" },
        ]}
        title={
          <>
            ファイル取り込み
            <span className="font-display mirai-gradient-text ml-2">{year}</span>
            <span className="text-xl ml-1">年度</span>
          </>
        }
        description="既存のxlsx/docxをアップロードすると、内容を自動判定して該当する書類に登録します。"
      />

      <div className="app-card p-5 text-xs text-[--color-muted] bg-[--color-brand-soft]/40 border-l-4 border-l-[--color-brand]">
        <div className="font-bold text-sm mb-1">📌 自動判定ルール</div>
        <ul className="list-disc ml-4 space-y-0.5">
          <li>
            <strong>xlsx</strong> ・「個人会計帳簿」シート → 個人会計帳簿（重複は sourceKey で自動スキップ）
          </li>
          <li>
            <strong>xlsx</strong> ・月別シート（7月/8月/...） → 自家用自動車使用簿（既存月は置換）
          </li>
          <li>
            <strong>docx</strong> ・「支払証明書」テンプレート → 支払証明書として新規登録
          </li>
          <li>
            <strong>docx</strong> ・「活動記録簿」テンプレート → 活動記録簿として新規登録（自動的に県外調査フラグon）
          </li>
        </ul>
        <p className="mt-2 text-[10px] text-[--color-faint]">
          ※ 取り込みは現在の年度（{year}年度）に紐づきます。年度を切り替えてからアップロードしてください。
        </p>
      </div>

      <ImportPanel action={importFilesAction} />
    </div>
  );
}
