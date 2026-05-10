import Link from "next/link";
import {
  currentFiscalYear,
  listActivitiesByYear,
  listActivityFiscalYears,
  listCertificateFiscalYears,
  listCertificatesByYear,
  listLedgerByYear,
  listReceiptFiscalYears,
  listReceiptsByYear,
  listVehicleTripsByYear,
} from "@/lib/storage";
import { getActiveYear } from "@/lib/active-year";
import { ensureFreshToken, googleConfigured } from "@/lib/google-auth";
import { EmptyState, MetaLine, Pill, SectionCard, StatTile } from "@/components/ui";
import { ExpandableList } from "@/components/expandable-list";
import { CertOutOfPrefGroup } from "@/components/cert-out-of-pref-group";
import { CategoryLegend, CircleProgress, DonutChart } from "@/components/visualizations";

export const dynamic = "force-dynamic";

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

export default async function HomePage() {
  const activeYear = await getActiveYear();
  const gConfigured = googleConfigured();
  const [certs, acts, receipts, ledger, trips, certYears, actYears, receiptYears, gToken] =
    await Promise.all([
      listCertificatesByYear(activeYear),
      listActivitiesByYear(activeYear),
      listReceiptsByYear(activeYear),
      listLedgerByYear(activeYear),
      listVehicleTripsByYear(activeYear),
      listCertificateFiscalYears(),
      listActivityFiscalYears(),
      listReceiptFiscalYears(),
      gConfigured ? ensureFreshToken() : Promise.resolve(null),
    ]);

  const knownYears = Array.from(
    new Set([...certYears, ...actYears, ...receiptYears, currentFiscalYear(), activeYear]),
  ).sort((a, b) => b - a);
  const nextYear = Math.max(...knownYears) + 1;

  const incomeSum = ledger.reduce((s, e) => s + (e.incomeYen || 0), 0);
  const expenseSum = ledger.reduce((s, e) => s + (e.allocatedYen || 0), 0);
  const remainder = incomeSum - expenseSum;
  const usageRate = incomeSum > 0 ? (expenseSum / incomeSum) * 100 : 0;
  const tripsKm = trips.reduce((s, t) => s + (t.businessKm || 0), 0);

  // ドーナツ用に経費種別ごと集計
  const CAT_COLORS: Record<string, string> = {
    調査研究費: "#006833",
    研修費: "#3e8c64",
    広報広聴費: "#7baf95",
    会議費: "#bcecd3",
    要請陳情活動費: "#a9e89d",
    資料作成費: "#d0e0cd",
    資料購入費: "#eae0da",
    事務所費: "#d97706",
    事務費: "#f99c00",
    人件費: "#5d5d5d",
  };
  const sumsByCategory = new Map<string, number>();
  for (const e of ledger) {
    const k = e.category || "未分類";
    sumsByCategory.set(k, (sumsByCategory.get(k) ?? 0) + (e.allocatedYen || 0));
  }
  const donutData = Object.keys(CAT_COLORS).map((k) => ({
    label: k,
    value: sumsByCategory.get(k) ?? 0,
    color: CAT_COLORS[k],
  }));
  const generatedCerts = certs.filter((c) => c.sourceKey?.startsWith("vehicle:")).length;
  const importedLedger = ledger.filter((e) => e.sourceKey).length;
  const lastUpdated = [
    ...certs.map((x) => x.updatedAt),
    ...acts.map((x) => x.updatedAt),
    ...receipts.map((x) => x.updatedAt),
  ]
    .filter(Boolean)
    .sort()
    .pop();

  return (
    <div className="relative">
      {/* Brand top accent bar */}
      <div className="mirai-gradient h-1.5 w-full" />
      <div className="mirai-blob mirai-gradient w-[460px] h-[460px] -top-32 -right-32" />

      <div className="relative max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* ===== Hero ===== */}
        <header className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-[--color-faint] tracking-wider uppercase font-display">
              Seimu Katsudohi · Admin
            </p>
            <h1 className="mt-2 flex items-baseline gap-3 flex-wrap">
              <span className="font-display text-[64px] leading-none mirai-gradient-text">
                {activeYear}
              </span>
              <span className="text-2xl font-bold tracking-tight">年度ダッシュボード</span>
            </h1>
            <p className="text-sm text-[--color-muted] mt-2 max-w-xl">
              政務活動費に関わる全書類を一元管理。書類同士は自動連携し、二重入力を防ぎます。
            </p>
            <MetaLine
              items={[
                { label: "対象期間", value: `${activeYear}/4 〜 ${activeYear + 1}/3` },
                {
                  label: "最終更新",
                  value: lastUpdated
                    ? new Date(lastUpdated).toLocaleString("ja-JP")
                    : "—",
                },
                { label: "アクセス", value: "限定公開" },
              ]}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap no-print">
            <form
              action="/api/year"
              method="post"
              className="flex items-center gap-1.5 flex-wrap"
            >
              <input type="hidden" name="back" value="/" />
              {knownYears.map((y) => (
                <button
                  key={y}
                  name="year"
                  value={y}
                  className={
                    y === activeYear
                      ? "btn btn-primary btn-sm"
                      : "btn btn-secondary btn-sm"
                  }
                >
                  {y}
                </button>
              ))}
              <button
                name="year"
                value={nextYear}
                className="btn btn-ghost btn-sm border border-dashed border-[--color-border-strong]"
              >
                + {nextYear}
              </button>
            </form>
            <form action="/api/auth" method="post">
              <input type="hidden" name="action" value="logout" />
              <button className="btn btn-ghost btn-sm text-[--color-faint]">
                ログアウト
              </button>
            </form>
          </div>
        </header>

        {/* ===== データ取り込みエリア ===== */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* ファイル取り込み（メイン導線） */}
          <Link
            href="/forms/import"
            className="app-card app-card-hover p-5 flex items-center justify-between gap-3 border-l-4 border-l-[--color-brand]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl mirai-gradient flex items-center justify-center text-white text-2xl shrink-0">
                📂
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold flex items-center gap-2">
                  データの取り込みはこちら
                  <Pill tone="mint">かんたん</Pill>
                </div>
                <p className="text-xs text-[--color-muted] mt-0.5 leading-relaxed">
                  既存のxlsx・docxをドラッグ&ドロップで自動登録
                </p>
              </div>
            </div>
            <span className="btn btn-mint btn-sm shrink-0">アップロード →</span>
          </Link>

          {/* Google Drive 連携 */}
          <Link
            href="/google-sync"
            className="app-card app-card-hover p-5 flex items-center justify-between gap-3 border-l-4 border-l-[--color-brand-light]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl mirai-gradient flex items-center justify-center text-white text-2xl shrink-0">
                ☁
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold flex items-center gap-2">
                  Google Drive 連携
                  {gToken ? (
                    <Pill tone="green">{gToken.email ?? "ログイン中"}</Pill>
                  ) : gConfigured ? (
                    <Pill tone="orange">未ログイン</Pill>
                  ) : (
                    <Pill tone="muted">未設定</Pill>
                  )}
                </div>
                <p className="text-xs text-[--color-muted] mt-0.5 leading-relaxed">
                  共有フォルダから自動取り込み・JSONバックアップ
                </p>
              </div>
            </div>
            <span className="btn btn-secondary btn-sm shrink-0">開く →</span>
          </Link>
        </section>

        {/* ===== サマリ：使用率 + ドーナツ + 4KPI ===== */}
        <section className="app-card p-6 grid grid-cols-1 md:grid-cols-[180px_240px_1fr] gap-6 items-center">
          <div className="flex flex-col items-center gap-2">
            <CircleProgress
              value={Math.min(usageRate, 100)}
              label={
                <span className="flex items-center gap-1">
                  <span>🌱</span>
                  <span>使用率</span>
                </span>
              }
              sub={
                <span>
                  ¥{Math.round(expenseSum / 10000).toLocaleString()}万 / ¥
                  {Math.round(incomeSum / 10000).toLocaleString()}万
                </span>
              }
              size={130}
            />
          </div>
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <DonutChart data={donutData} size={170} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatTile label="🌸 収入" value={yen(incomeSum)} sub={`${activeYear}年度 交付`} tone="mint" />
            <StatTile label="🍃 支出（充当）" value={yen(expenseSum)} sub={`使用率 ${usageRate.toFixed(1)}%`} />
            <StatTile
              label={remainder >= 0 ? "🌷 残余" : "⚠ 残余"}
              value={yen(remainder)}
              sub={remainder >= 0 ? "繰越予定" : "超過"}
              tone={remainder >= 0 ? "green" : "red"}
            />
            <StatTile
              label="🚗 走行距離"
              value={`${tripsKm.toFixed(1)} km`}
              sub={`政務活動 ${trips.length}件`}
            />
          </div>
        </section>

        <section className="app-card p-5">
          <header className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              <span>🪻</span>
              <span>経費種別ごとの構成</span>
            </h2>
            <span className="text-[10px] text-[--color-faint]">帳簿ベース</span>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CategoryLegend data={donutData} />
            <div className="space-y-1.5 text-[11px]">
              <p className="text-[--color-muted] leading-relaxed">
                色帯はそれぞれの経費種別に対応します。割合が大きい順に表示。<br />
                編集は <span className="text-[--color-brand] font-bold">個人会計帳簿</span> から。
              </p>
            </div>
          </div>
        </section>

        {/* ===== データの流れ ===== */}
        <section className="app-card p-5">
          <div className="section-title mb-3">
            <span>データの流れ</span>
            <small>各書類は連携しています。下流の書類は上流から自動的に値を引き継ぎます。</small>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-3 items-center">
            <div className="flow-card flow-card-strong">
              <Pill tone="muted">最終出力</Pill>
              <div className="font-bold">政務活動費 収支報告書</div>
              <p className="text-xs text-[--color-muted]">別記第5号様式 ・ 議長へ提出</p>
            </div>
            <span className="flow-arrow rotate-90 md:rotate-0 self-center justify-self-center">←</span>
            <div className="flow-card flow-card-strong">
              <Pill tone="mint">中核台帳</Pill>
              <div className="font-bold">個人会計帳簿</div>
              <p className="text-xs text-[--color-muted]">参考様式1 ・ 全取引を集約</p>
            </div>
            <span className="flow-arrow rotate-90 md:rotate-0 self-center justify-self-center">←</span>
            <div className="flow-card">
              <Pill tone="muted">入力ソース</Pill>
              <div className="text-sm font-medium leading-snug">
                支払証明書 / 活動記録簿
                <br />
                自家用自動車使用簿 / 領収書
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[--color-faint] mt-3 leading-relaxed">
            <span className="font-display text-[--color-brand]">●</span> 自動車使用簿の走行距離は支払証明書（調査研究費・研修費の交通費）に自動反映されます。
            <br />
            <span className="font-display text-[--color-brand]">●</span> 支払証明書・活動記録簿の明細は会計帳簿に取り込めます（重複は自動スキップ）。
            <br />
            <span className="font-display text-[--color-brand]">●</span> 会計帳簿の集計が、そのまま収支報告書の各項目になります。
          </p>
        </section>

        {/* ===================================================== */}
        {/* 1) 政務活動収支報告書 — 最終出力 */}
        {/* ===================================================== */}
        <SectionCard
          title="① 政務活動費 収支報告書"
          meta={`別記第5号様式 · ${ledger.length}行から自動集計`}
          description="議会議長への提出書類。会計帳簿の集計値がそのまま反映されます。"
          actions={
            <Link href="/forms/ledger/report" className="btn btn-mint">
              報告書を表示・印刷
            </Link>
          }
        >
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Pill tone="muted">↑ 受け取り</Pill>
            <span className="text-xs text-[--color-muted]">
              個人会計帳簿の合計を自動集計
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatTile label="収入" value={yen(incomeSum)} />
            <StatTile label="支出（充当）" value={yen(expenseSum)} />
            <StatTile
              label="残余"
              value={yen(remainder)}
              tone={remainder >= 0 ? "green" : "red"}
            />
            <StatTile label="使用率" value={`${usageRate.toFixed(1)}%`} />
          </div>
        </SectionCard>

        {/* ===================================================== */}
        {/* 2) 個人会計帳簿 — 中核台帳 */}
        {/* ===================================================== */}
        <SectionCard
          title="② 個人会計帳簿"
          meta={`参考様式1 · ${ledger.length}行 (うち取り込み ${importedLedger}行)`}
          description="全取引を一元集約する中核の台帳。報告書はここから集計されます。"
          actions={
            <>
              <Link href="/forms/ledger" className="btn btn-secondary">
                帳簿を編集
              </Link>
              <Link href="/forms/ledger/report" className="btn btn-mint">
                報告書を表示
              </Link>
            </>
          }
        >
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Pill tone="muted">↑ 取り込み元</Pill>
            <span className="text-xs text-[--color-muted]">
              支払証明書 ・ 活動記録簿
            </span>
            <span className="text-[--color-faint]">→</span>
            <Pill tone="mint">↓ 出力先</Pill>
            <span className="text-xs text-[--color-muted]">収支報告書</span>
          </div>
          {ledger.length === 0 ? (
            <EmptyState
              title="帳簿はまだ空です"
              hint="活動記録簿・支払証明書から取り込み、または手入力できます。"
            />
          ) : (
            <p className="text-xs text-[--color-muted]">
              ガソリン代の整合性チェックは
              <Link href="/forms/ledger/report" className="underline mx-1">
                報告書ページ
              </Link>
              で確認できます。
            </p>
          )}
        </SectionCard>

        {/* ===================================================== */}
        {/* 3) 支払証明書 */}
        {/* ===================================================== */}
        {(() => {
          const regularCerts = certs.filter((c) => !c.linkedActivityId);
          const outOfPrefCerts = certs.filter((c) => !!c.linkedActivityId);
          return (
            <SectionCard
              title="③ 支払証明書"
              meta={`別記第7号様式 · ${certs.length}件 (うち自動生成 ${generatedCerts}件)`}
              description="経費種別ごとに支払明細を記載する書類。自動車使用簿のガソリン代分・活動記録の県外調査分を自動生成できます。"
              actions={
                <Link href="/forms/payment-certificate/new" className="btn btn-mint">
                  + 新規作成
                </Link>
              }
            >
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Pill tone="muted">↑ 取り込み元</Pill>
                <span className="text-xs text-[--color-muted]">
                  自家用自動車使用簿（ガソリン代） / 活動記録簿（県外調査）
                </span>
                <span className="text-[--color-faint]">→</span>
                <Pill tone="mint">↓ 出力先</Pill>
                <span className="text-xs text-[--color-muted]">個人会計帳簿</span>
              </div>

              {certs.length === 0 ? (
                <EmptyState title="この年度の支払証明書はまだありません" />
              ) : (
                <div className="space-y-5">
                  {/* 通常の支払証明書 */}
                  {regularCerts.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-[--color-muted] mb-1.5 flex items-center gap-1.5">
                        <span>📑</span>
                        <span>通常の支払証明書</span>
                        <span className="text-[--color-faint] font-normal">
                          {regularCerts.length}件
                        </span>
                      </h4>
                      <ul className="divide-y divide-[--color-border]">
                        {regularCerts.map((c) => (
                          <li
                            key={c.id}
                            className="py-2.5 flex items-center justify-between gap-3"
                          >
                            <Link
                              href={`/forms/payment-certificate/${c.id}`}
                              className="min-w-0 flex items-center gap-3 flex-wrap hover:text-[--color-brand] flex-1 group"
                            >
                              <span className="text-sm font-bold group-hover:underline">
                                {c.category}
                              </span>
                              {c.sourceKey?.startsWith("vehicle:") && (
                                <Pill tone="mint">自動車使用簿から生成</Pill>
                              )}
                              <span className="text-xs text-[--color-faint]">
                                {c.entries.length}件 · 充当{" "}
                                <span className="font-display tabular-nums">
                                  {yen(
                                    c.entries.reduce((s, e) => s + (e.allocatedYen || 0), 0),
                                  )}
                                </span>
                              </span>
                            </Link>
                            <Link
                              href={`/forms/payment-certificate/${c.id}`}
                              className="btn btn-ghost btn-sm"
                            >
                              編集 / 印刷 →
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <CertOutOfPrefGroup certs={outOfPrefCerts} activities={acts} />
                </div>
              )}
            </SectionCard>
          );
        })()}

        {/* ===================================================== */}
        {/* 4) 活動記録簿 */}
        {/* ===================================================== */}
        <SectionCard
          title="④ 活動記録簿"
          meta={`参考様式4 · ${acts.length}件`}
          description="視察・研修・会議などの活動内容を記録する書類。"
          actions={
            <Link href="/forms/activity-record" className="btn btn-mint">
              まとめて編集・印刷
            </Link>
          }
        >
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Pill tone="mint">↓ 出力先</Pill>
            <span className="text-xs text-[--color-muted]">個人会計帳簿（取り込みボタン）</span>
          </div>
          {acts.length === 0 ? (
            <EmptyState title="この年度の記録はまだありません" />
          ) : (
            <ExpandableList
              initial={acts.slice(0, 6).map((a) => (
                <li
                  key={a.id}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <Link
                    href={`/forms/activity-record/${a.id}`}
                    className="min-w-0 flex-1 hover:text-[--color-brand] group"
                  >
                    <div className="text-sm font-medium truncate group-hover:underline">
                      <span className="font-display tabular-nums">
                        {a.implementationDate || "(未設定)"}
                      </span>
                      <span className="mx-1.5 text-[--color-faint]">·</span>
                      <span>{a.location || "(場所未設定)"}</span>
                      {a.outOfPrefecture && (
                        <span className="ml-2"><Pill tone="orange">県外調査</Pill></span>
                      )}
                    </div>
                    <div className="text-xs text-[--color-faint] truncate max-w-2xl">
                      {a.purposeContent.slice(0, 70) || "—"}
                      {a.purposeContent.length > 70 ? "…" : ""}
                    </div>
                  </Link>
                  <Link
                    href={`/forms/activity-record/${a.id}`}
                    className="btn btn-ghost btn-sm"
                  >
                    開く →
                  </Link>
                </li>
              ))}
              more={acts.slice(6).map((a) => (
                <li
                  key={a.id}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <Link
                    href={`/forms/activity-record/${a.id}`}
                    className="min-w-0 flex-1 hover:text-[--color-brand] group"
                  >
                    <div className="text-sm font-medium truncate group-hover:underline">
                      <span className="font-display tabular-nums">
                        {a.implementationDate || "(未設定)"}
                      </span>
                      <span className="mx-1.5 text-[--color-faint]">·</span>
                      <span>{a.location || "(場所未設定)"}</span>
                      {a.outOfPrefecture && (
                        <span className="ml-2"><Pill tone="orange">県外調査</Pill></span>
                      )}
                    </div>
                    <div className="text-xs text-[--color-faint] truncate max-w-2xl">
                      {a.purposeContent.slice(0, 70) || "—"}
                      {a.purposeContent.length > 70 ? "…" : ""}
                    </div>
                  </Link>
                  <Link
                    href={`/forms/activity-record/${a.id}`}
                    className="btn btn-ghost btn-sm"
                  >
                    開く →
                  </Link>
                </li>
              ))}
            />
          )}
        </SectionCard>

        {/* ===================================================== */}
        {/* 5) 自家用自動車使用簿 */}
        {/* ===================================================== */}
        <SectionCard
          title="⑤ 自家用自動車使用簿"
          meta={`参考様式3 · ${trips.length}件 / ${tripsKm.toFixed(1)}km`}
          description="走行距離から充当額(km×20円)を自動計算。月単位で支払証明書を再生成できます。"
          actions={
            <Link href="/forms/vehicle-log" className="btn btn-mint">
              月別に編集
            </Link>
          }
        >
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Pill tone="mint">↓ 出力先</Pill>
            <span className="text-xs text-[--color-muted]">支払証明書（経費種別ごと、月単位で再生成）</span>
          </div>
          {trips.length === 0 ? (
            <EmptyState title="この年度の使用記録はまだありません" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <StatTile label="件数" value={`${trips.length}`} />
              <StatTile label="政務活動 km" value={`${tripsKm.toFixed(1)}`} />
              <StatTile label="充当額(20円/km)" value={yen(Math.round(tripsKm * 20))} />
              <StatTile
                label="月別カバー"
                value={`${new Set(trips.map((t) => t.month)).size}/12 月`}
              />
            </div>
          )}
        </SectionCard>

        {/* ===================================================== */}
        {/* 6) 領収書 — 独立 */}
        {/* ===================================================== */}
        <SectionCard
          title="⑥ 領収書"
          meta={`${receipts.length}枚`}
          description="PDF/画像をアップロード→ページ単位で自動分割し、経費種別ごとに整理します。"
          actions={
            <>
              <Link href="/forms/receipt" className="btn btn-secondary">
                一覧
              </Link>
              <Link href="/forms/receipt/upload" className="btn btn-mint">
                + アップロード
              </Link>
            </>
          }
        >
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Pill tone="muted">独立管理</Pill>
            <span className="text-xs text-[--color-muted]">
              他書類との自動連携はなし。経費種別ごとにまとめて印刷できます。
            </span>
          </div>
          {receipts.length === 0 ? (
            <EmptyState title="この年度の領収書はまだありません" />
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {receipts.slice(0, 16).map((r) => (
                <Link
                  key={r.id}
                  href={`/forms/receipt/${r.id}`}
                  className="block app-card app-card-hover overflow-hidden rounded-xl"
                  title={`${r.category} ${r.date || ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/receipts/${r.imageFile}`}
                    alt=""
                    className="w-full h-20 object-contain bg-[--color-surface-2]"
                  />
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <footer className="text-xs text-[--color-faint] pt-8 mt-8 border-t border-[--color-border]">
          <MetaLine
            items={[
              { label: "アクセス制御", value: "パスワード+httpOnly cookie" },
              { label: "データ保存", value: "ローカルJSON" },
              { label: "印刷", value: "各書類画面の印刷ボタンから" },
            ]}
          />
        </footer>
      </div>
    </div>
  );
}
