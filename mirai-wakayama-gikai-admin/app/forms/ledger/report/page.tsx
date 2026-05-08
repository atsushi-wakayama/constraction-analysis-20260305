import { getActiveYear } from "@/lib/active-year";
import { listCertificatesByYear, listLedgerByYear } from "@/lib/storage";
import { PrintButton } from "@/components/print-button";
import { PageHeader, Pill, StatTile } from "@/components/ui";
import type { ExpenseCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

// PDF表記順
const REPORT_ROWS: { internal: ExpenseCategory; label: string }[] = [
  { internal: "調査研究費", label: "調査研究費" },
  { internal: "研修費", label: "研　修　費" },
  { internal: "広報広聴費", label: "広聴広報費" },
  { internal: "要請陳情活動費", label: "要請陳情等活動費" },
  { internal: "会議費", label: "会　議　費" },
  { internal: "資料作成費", label: "資料作成費" },
  { internal: "資料購入費", label: "資料購入費" },
  { internal: "事務所費", label: "事務所費" },
  { internal: "事務費", label: "事務費" },
  { internal: "人件費", label: "人　件　費" },
];

// 主たる支出の内訳（経費種別ごとのデフォルト表記）
const DEFAULT_BREAKDOWN: Record<string, string> = {
  調査研究費: "高速代金等",
  研修費: "議会連盟会費",
  広報広聴費: "広報活動に係る経費等",
  要請陳情活動費: "",
  会議費: "会議、意見交換に係る経費等",
  資料作成費: "",
  資料購入費: "新聞購入経費",
  事務所費: "事務所賃借料等",
  事務費: "事務用品購入費等",
  人件費: "事務員給料",
};

const GAS_KEYWORDS = ["ガソリン"];
// 高速代・ETC は別カテゴリの実費なので比較対象外

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

function isGasoline(content: string): boolean {
  return GAS_KEYWORDS.some((k) => content.includes(k));
}

export default async function LedgerReportPage() {
  const year = await getActiveYear();
  const reiwaYear = year - 2018;
  const [entries, certs] = await Promise.all([
    listLedgerByYear(year),
    listCertificatesByYear(year),
  ]);

  const incomeSum = entries.reduce((s, e) => s + (e.incomeYen || 0), 0);
  const sumsByCategory = new Map<string, number>();
  for (const e of entries) {
    const k = e.category || "未分類";
    sumsByCategory.set(k, (sumsByCategory.get(k) ?? 0) + (e.allocatedYen || 0));
  }
  const expenseSum = Array.from(sumsByCategory.values()).reduce((s, v) => s + v, 0);
  const remainder = incomeSum - expenseSum;
  const usageRate = incomeSum > 0 ? (expenseSum / incomeSum) * 100 : 0;

  // ガソリン代チェック
  const ledgerGasSum = entries
    .filter(
      (e) =>
        (e.category === "調査研究費" || e.category === "研修費") &&
        isGasoline(`${e.content} ${e.payee}`),
    )
    .reduce((s, e) => s + (e.allocatedYen || 0), 0);
  const vehicleCertSum = certs
    .filter((c) => c.sourceKey?.startsWith("vehicle:"))
    .reduce(
      (s, c) => s + c.entries.reduce((sub, en) => sub + (en.allocatedYen || 0), 0),
      0,
    );
  const gasMatch = ledgerGasSum === vehicleCertSum;
  const gasDiff = ledgerGasSum - vehicleCertSum;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <PageHeader
        breadcrumb={[
          { href: "/", label: "ダッシュボード" },
          { href: "/forms/ledger", label: "個人会計帳簿" },
          { href: "/forms/ledger/report", label: "報告書(個人)" },
        ]}
        title={
          <>
            収支報告書（個人）
            <span className="font-display mirai-gradient-text ml-2">{year}</span>
            <span className="text-xl ml-1">年度</span>
          </>
        }
        description="会計帳簿の集計値です。印刷ボタンから別記第5号様式の体裁で印刷できます。"
        actions={<PrintButton label="報告書を印刷" />}
      />

      {/* KPIタイル（参考表示・印刷除外） */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
        <StatTile label="収入" value={yen(incomeSum)} tone="mint" />
        <StatTile label="支出（充当）" value={yen(expenseSum)} />
        <StatTile
          label="残余"
          value={yen(remainder)}
          tone={remainder >= 0 ? "green" : "red"}
          sub={remainder >= 0 ? "繰越予定" : "超過"}
        />
        <StatTile label="使用率" value={`${usageRate.toFixed(1)}%`} />
      </section>

      {/* ガソリン代整合チェック（参考表示・印刷除外） */}
      <section
        className={`rounded-2xl border p-4 no-print ${
          gasMatch
            ? "bg-[--color-mirai-green-soft] border-[--color-mirai-green-deep]/20"
            : "bg-[--color-mirai-red-soft] border-[--color-mirai-red]/20"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-bold">
            {gasMatch ? "✓ " : "⚠ "}ガソリン代の整合性チェック
          </span>
          <Pill tone={gasMatch ? "green" : "red"}>
            {gasMatch ? "一致" : `差額 ${yen(gasDiff)}`}
          </Pill>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 text-xs">
          <dt className="text-[--color-muted]">帳簿（調査研究費・研修費 × ガソリン代のみ）</dt>
          <dd className="text-right tabular-nums font-medium">{yen(ledgerGasSum)}</dd>
          <dt className="text-[--color-muted]">自動車使用簿から生成された支払証明書</dt>
          <dd className="text-right tabular-nums font-medium">{yen(vehicleCertSum)}</dd>
        </dl>
      </section>

      {/* ===== 報告書本体（印刷対象 / 別記第5号様式準拠） ===== */}
      <article className="report-doc app-card p-10 print:border-0 print:p-0 print:bg-white">
        <div className="text-xs">別記第５号様式（第４条関係）</div>

        {/* 上段: 令和X年 月 日（右） */}
        <div className="flex justify-end mt-2 text-sm">
          <span>
            令和{reiwaYear + 1}年　　月　　　日
          </span>
        </div>

        {/* 宛名 + 氏名 */}
        <div className="mt-3 text-sm">和歌山県議会議長　様</div>
        <div className="text-right text-sm mt-2">
          氏　名
          <span className="inline-block min-w-[10ch] border-b border-[--color-foreground] pb-0.5 font-medium">
            岩永淳志
          </span>
        </div>

        {/* タイトル */}
        <h2 className="text-center text-xl font-bold tracking-[0.4em] my-8">
          政務活動費収支報告書
        </h2>

        {/* 前文 */}
        <p className="text-sm leading-loose">
          　令和{reiwaYear}年6月10日付け和議会第66号で交付決定のあった政務活動費について、和歌山県政務活動費の交付に関する条例第１１条第１項の規定により、令和{reiwaYear}年度政務活動費の収入及び支出を下記のとおり報告します。
        </p>

        <div className="text-center text-sm my-4">記</div>

        {/* 1 収入 */}
        <div className="text-sm">
          <div className="font-medium">１　収入</div>
          <div className="ml-8 mt-2 flex items-baseline gap-3">
            <span>政務活動費</span>
            <span className="font-mono tabular-nums border-b border-[--color-foreground] inline-block min-w-[12ch] text-right pb-0.5">
              {incomeSum.toLocaleString()}
            </span>
            <span>円</span>
          </div>
        </div>

        {/* 2 支出 */}
        <div className="text-sm mt-6">
          <div className="font-medium">２　支出</div>
          <div className="text-right text-xs mt-1 mr-1">（単位：円）</div>
          <table className="w-full border-collapse text-sm mt-1 border border-[--color-foreground]">
            <thead>
              <tr>
                <th className="border border-[--color-foreground] px-2 py-2 w-32 text-center">
                  経　費
                </th>
                <th className="border border-[--color-foreground] px-2 py-2 w-28 text-center">
                  支出額
                </th>
                <th className="border border-[--color-foreground] px-2 py-2 text-center">
                  主たる支出の内訳
                </th>
              </tr>
            </thead>
            <tbody>
              {REPORT_ROWS.map(({ internal, label }) => {
                const v = sumsByCategory.get(internal) ?? 0;
                const breakdown = v > 0 ? DEFAULT_BREAKDOWN[internal] ?? "" : "";
                return (
                  <tr key={internal}>
                    <td className="border border-[--color-foreground] px-2 py-2 text-center">
                      {label}
                    </td>
                    <td className="border border-[--color-foreground] px-2 py-2 text-right tabular-nums font-mono">
                      {v.toLocaleString()}
                    </td>
                    <td className="border border-[--color-foreground] px-3 py-2">
                      {breakdown}
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td className="border border-[--color-foreground] px-2 py-2 text-center font-medium">
                  合　計
                </td>
                <td className="border border-[--color-foreground] px-2 py-2 text-right tabular-nums font-mono font-bold">
                  {expenseSum.toLocaleString()}
                </td>
                <td className="border border-[--color-foreground] px-3 py-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3 残余 */}
        <div className="text-sm mt-6">
          <div className="font-medium">３　残余</div>
          <div className="ml-8 mt-2 flex items-baseline gap-3">
            <span className="font-mono tabular-nums border-b border-[--color-foreground] inline-block min-w-[12ch] text-right pb-0.5">
              {remainder.toLocaleString()}
            </span>
            <span>円</span>
          </div>
        </div>
      </article>

      {/* 未分類（参考表示・印刷除外） */}
      {sumsByCategory.has("未分類") && (
        <p className="text-xs text-[--color-faint] no-print">
          ※ 未分類の支出 {yen(sumsByCategory.get("未分類") ?? 0)} があります（経費種別を設定すると報告書に反映されます）
        </p>
      )}
    </div>
  );
}
