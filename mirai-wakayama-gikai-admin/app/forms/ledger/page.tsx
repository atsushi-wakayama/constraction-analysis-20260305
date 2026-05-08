import Link from "next/link";
import { getActiveYear } from "@/lib/active-year";
import { listLedgerByYear } from "@/lib/storage";
import { LedgerEditor } from "@/components/ledger-editor";
import { PageHeader } from "@/components/ui";
import { importFromActivityAction, saveLedgerAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const year = await getActiveYear();
  const entries = await listLedgerByYear(year);
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-4">
      <PageHeader
        breadcrumb={[
          { href: "/", label: "ダッシュボード" },
          { href: "/forms/ledger", label: "個人会計帳簿" },
        ]}
        title={
          <>
            個人会計帳簿
            <span className="font-display mirai-gradient-text ml-2">{year}</span>
            <span className="text-xl ml-1">年度</span>
          </>
        }
        description="参考様式1。活動記録簿・支払証明書から取り込みもできます。重複は sourceKey で自動スキップ。背景色がついている行は取り込み行です。"
        actions={
          <Link href="/forms/ledger/report" className="btn btn-mint">
            報告書(個人)を見る
          </Link>
        }
      />
      <LedgerEditor
        key={year}
        initial={entries}
        fiscalYear={year}
        saveAction={saveLedgerAction}
        importActivity={importFromActivityAction}
      />
    </div>
  );
}
