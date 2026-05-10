import Link from "next/link";
import { getActiveYear } from "@/lib/active-year";
import {
  listActivitiesByYear,
  listCertificatesByYear,
  listLedgerByYear,
} from "@/lib/storage";
import { LedgerEditor } from "@/components/ledger-editor";
import { PageHeader } from "@/components/ui";
import type { ExpenseCategory } from "@/lib/types";
import { importFromActivityAction, saveLedgerAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const year = await getActiveYear();
  const [entries, certs, activities] = await Promise.all([
    listLedgerByYear(year),
    listCertificatesByYear(year),
    listActivitiesByYear(year),
  ]);

  // 各カテゴリで支払証明書／活動記録の集計値を準備（備考アラート用）
  const certSums: Partial<Record<ExpenseCategory, number>> = {};
  const certCounts: Partial<Record<ExpenseCategory, number>> = {};
  for (const c of certs) {
    const sum = c.entries.reduce((s, e) => s + (e.allocatedYen || 0), 0);
    certSums[c.category] = (certSums[c.category] ?? 0) + sum;
    certCounts[c.category] = (certCounts[c.category] ?? 0) + 1;
  }
  const activitySums: Partial<Record<ExpenseCategory, number>> = {};
  for (const a of activities) {
    for (const exp of a.expenses) {
      const cat = exp.category as ExpenseCategory;
      if (!cat) continue;
      activitySums[cat] = (activitySums[cat] ?? 0) + (exp.allocatedYen || 0);
    }
  }
  // ガソリン代（自動車使用簿から自動生成）の合計
  const vehicleCertSum = certs
    .filter((c) => c.sourceKey?.startsWith("vehicle:"))
    .reduce(
      (s, c) => s + c.entries.reduce((sub, e) => sub + (e.allocatedYen || 0), 0),
      0,
    );

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
        certSumsByCategory={certSums}
        activitySumsByCategory={activitySums}
        vehicleCertSum={vehicleCertSum}
      />
    </div>
  );
}
