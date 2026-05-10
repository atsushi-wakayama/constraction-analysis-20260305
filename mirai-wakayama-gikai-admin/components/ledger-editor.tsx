"use client";

import { useMemo, useState, useTransition } from "react";
import type { ExpenseCategory, LedgerEntry } from "@/lib/types";

const CATEGORIES: (ExpenseCategory | "")[] = [
  "",
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
];

type SaveAction = (form: FormData) => Promise<void>;
type ImportAction = () => Promise<{ added: number; skipped: number }>;

type SortKey =
  | "date"
  | "category"
  | "content"
  | "payee"
  | "incomeYen"
  | "expenseYen"
  | "allocationRatio"
  | "allocatedYen"
  | "note";
type SortDir = "asc" | "desc";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function blankRow(year: number): LedgerEntry {
  return {
    id: uid(),
    fiscalYear: year,
    date: "",
    category: "",
    content: "",
    payee: "",
    incomeYen: 0,
    expenseYen: 0,
    allocationRatio: 1,
    allocatedYen: 0,
    note: "",
  };
}

export function LedgerEditor({
  initial,
  fiscalYear,
  saveAction,
  importActivity,
  certSumsByCategory = {},
  activitySumsByCategory = {},
  vehicleCertSum = 0,
}: {
  initial: LedgerEntry[];
  fiscalYear: number;
  saveAction: SaveAction;
  importActivity: ImportAction;
  certSumsByCategory?: Partial<Record<ExpenseCategory, number>>;
  activitySumsByCategory?: Partial<Record<ExpenseCategory, number>>;
  vehicleCertSum?: number;
}) {
  const [rows, setRows] = useState<LedgerEntry[]>(
    initial.length ? initial : [blankRow(fiscalYear)],
  );
  const [savePending, startSave] = useTransition();
  const [importPending, startImport] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>({
    key: "date",
    dir: "asc",
  });
  const [flashRowId, setFlashRowId] = useState<string | null>(null);

  function patch(i: number, p: Partial<LedgerEntry>) {
    setRows((arr) =>
      arr.map((r, idx) => {
        if (idx !== i) return r;
        const next = { ...r, ...p };
        if ("expenseYen" in p || "allocationRatio" in p) {
          const ratio = Number(next.allocationRatio) || 0;
          const expense = Number(next.expenseYen) || 0;
          if (!("allocatedYen" in p)) {
            next.allocatedYen = Math.round(expense * ratio);
          }
        }
        return next;
      }),
    );
  }

  function addRow() {
    const r = blankRow(fiscalYear);
    setRows((a) => [...a, r]);
    setFlashRowId(r.id);
    setTimeout(() => {
      // スクロールして可視化
      document.getElementById(`ledger-row-${r.id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 30);
    setTimeout(() => setFlashRowId(null), 1200);
  }

  function save() {
    const fd = new FormData();
    fd.set("fiscalYear", String(fiscalYear));
    const filtered = rows.filter(
      (r) => r.date || r.content || r.payee || r.expenseYen || r.incomeYen,
    );
    fd.set("payload", JSON.stringify(filtered));
    setMsg(null);
    startSave(async () => {
      await saveAction(fd);
      setMsg("✓ 保存しました");
    });
  }

  async function runImport(fn: ImportAction, label: string) {
    setMsg(null);
    startImport(async () => {
      const r = await fn();
      setMsg(
        `${label}: 追加 ${r.added}件 / スキップ ${r.skipped}件（重複）。ページを再読み込みして反映してください。`,
      );
    });
  }

  const visible = useMemo(() => {
    let v = rows;
    if (categoryFilter) {
      v = v.filter((r) => r.category === categoryFilter);
    }
    if (filter) {
      const q = filter.toLowerCase();
      v = v.filter(
        (r) =>
          (r.content || "").toLowerCase().includes(q) ||
          (r.payee || "").toLowerCase().includes(q) ||
          (r.category || "").toLowerCase().includes(q) ||
          (r.note || "").toLowerCase().includes(q),
      );
    }
    if (sort) {
      const { key, dir } = sort;
      v = [...v].sort((a, b) => {
        const av = a[key] ?? "";
        const bv = b[key] ?? "";
        if (typeof av === "number" && typeof bv === "number") {
          return dir === "asc" ? av - bv : bv - av;
        }
        return dir === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }
    return v;
  }, [rows, filter, categoryFilter, sort]);

  // 集計プレビュー
  const incomeSum = rows.reduce((s, r) => s + (r.incomeYen || 0), 0);
  const expenseSum = rows.reduce((s, r) => s + (r.expenseYen || 0), 0);
  const allocSum = rows.reduce((s, r) => s + (r.allocatedYen || 0), 0);

  const reportRows = useMemo(() => {
    type Row = { internal: ExpenseCategory; label: string };
    const ROWS: Row[] = [
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
    return ROWS.map((r) => {
      const ledgerSum = rows
        .filter((e) => e.category === r.internal)
        .reduce((s, e) => s + (e.allocatedYen || 0), 0);
      const certSum = certSumsByCategory[r.internal] ?? 0;
      const activitySum = activitySumsByCategory[r.internal] ?? 0;

      // 帳簿のガソリン代だけ抽出
      const ledgerGasSum = rows
        .filter(
          (e) =>
            e.category === r.internal &&
            (`${e.content} ${e.payee}`.includes("ガソリン")),
        )
        .reduce((s, e) => s + (e.allocatedYen || 0), 0);

      const alerts: { tone: "warning" | "danger" | "info"; text: string }[] = [];

      // 1. 支払証明書 vs 帳簿
      if (certSum > 0) {
        const diff = ledgerSum - certSum;
        if (Math.abs(diff) > 0) {
          alerts.push({
            tone: "warning",
            text: `支払証明書 ¥${certSum.toLocaleString()} と差額 ${diff > 0 ? "+" : ""}¥${diff.toLocaleString()}`,
          });
        }
      }

      // 2. 活動記録簿 vs 帳簿
      if (activitySum > 0) {
        const diff = ledgerSum - activitySum;
        if (Math.abs(diff) > 0) {
          alerts.push({
            tone: "warning",
            text: `活動記録 ¥${activitySum.toLocaleString()} と差額 ${diff > 0 ? "+" : ""}¥${diff.toLocaleString()}`,
          });
        }
      }

      // 3. 調査研究費・研修費限定: ガソリン代の整合
      if (
        (r.internal === "調査研究費" || r.internal === "研修費") &&
        vehicleCertSum > 0
      ) {
        // この行は概念的にカテゴリ全体だが、ガソリン代に限定した比較も補足表示
        if (r.internal === "調査研究費") {
          // 自動車使用簿生成certの「調査研究費」分を抽出するのは難しいので、合計のみ参考表示
          // alerts already covers cert vs ledger; 追加メッセージなし
        }
      }

      // 4. 帳簿に何も無いがcertにある
      if (ledgerSum === 0 && certSum > 0) {
        alerts.push({
          tone: "danger",
          text: `支払証明書 ¥${certSum.toLocaleString()} があるが帳簿は空`,
        });
      }

      return {
        internal: r.internal,
        label: r.label,
        sum: ledgerSum,
        ledgerGasSum,
        alerts,
      };
    });
  }, [rows, certSumsByCategory, activitySumsByCategory, vehicleCertSum]);

  // 全体ガソリン代チェック（調査研究費＋研修費の帳簿ガソリン代 vs 自動車使用簿生成cert）
  const globalGasAlert = useMemo(() => {
    if (vehicleCertSum === 0) return null;
    const ledgerGas = rows
      .filter(
        (e) =>
          (e.category === "調査研究費" || e.category === "研修費") &&
          `${e.content} ${e.payee}`.includes("ガソリン"),
      )
      .reduce((s, e) => s + (e.allocatedYen || 0), 0);
    if (ledgerGas === vehicleCertSum) return null;
    const diff = ledgerGas - vehicleCertSum;
    return {
      ledgerGas,
      vehicleCertSum,
      diff,
    };
  }, [rows, vehicleCertSum]);

  function toggleSort(key: SortKey) {
    setSort((cur) => {
      if (cur?.key !== key) return { key, dir: "asc" };
      if (cur.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  function sortIcon(key: SortKey) {
    if (sort?.key !== key) return <span className="text-[--color-faint]">⇅</span>;
    return sort.dir === "asc" ? "▲" : "▼";
  }

  return (
    <div className="space-y-4">
      {/* ===== 集計プレビュー（コンパクト） ===== */}
      <section className="app-card p-4 bg-gradient-to-br from-[--color-brand-soft]/40 via-white to-white">
        <header className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <span>🌱</span>
            <span>集計プレビュー</span>
          </h3>
          <div className="text-[11px] text-[--color-faint]">編集中の値で更新</div>
        </header>

        {/* 上段: 収入 / 支出 / 残余 */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-xl bg-white border border-[--color-border] px-3 py-2">
            <div className="text-[10px] text-[--color-faint]">収入</div>
            <div className="font-display tabular-nums text-base text-[--color-brand-deep]">
              ¥{incomeSum.toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl bg-white border border-[--color-border] px-3 py-2">
            <div className="text-[10px] text-[--color-faint]">支出</div>
            <div className="font-display tabular-nums text-base">
              ¥{expenseSum.toLocaleString()}
            </div>
          </div>
          <div
            className={`rounded-xl border px-3 py-2 ${
              incomeSum - expenseSum >= 0
                ? "bg-[--color-brand-soft] border-[--color-brand-light]"
                : "bg-[--color-mirai-red-soft] border-[--color-mirai-red]/30"
            }`}
          >
            <div className="text-[10px] text-[--color-faint]">残余</div>
            <div
              className={`font-display tabular-nums text-base ${
                incomeSum - expenseSum >= 0
                  ? "text-[--color-brand-deep]"
                  : "text-[--color-mirai-red]"
              }`}
            >
              ¥{(incomeSum - expenseSum).toLocaleString()}
            </div>
          </div>
        </div>

        {/* 下段: 経費種別ごと（コンパクトなバーリスト） */}
        <ul className="space-y-1">
          {reportRows.map((r) => {
            const ratio = expenseSum > 0 ? (r.sum / expenseSum) * 100 : 0;
            const isZero = r.sum === 0;
            return (
              <li
                key={r.label}
                className={`grid grid-cols-[110px_1fr_90px] items-center gap-2 px-1 ${
                  isZero ? "opacity-40" : ""
                }`}
              >
                <span className="text-xs text-[--color-foreground]">
                  {r.label.replace(/[\s　]/g, "")}
                </span>
                <div className="h-2 rounded-full bg-[--color-surface-3] overflow-hidden">
                  <div
                    className="h-2 rounded-full mirai-gradient transition-all duration-500 ease-out"
                    style={{ width: `${ratio}%` }}
                  />
                </div>
                <span className="text-right text-xs font-display tabular-nums">
                  ¥{r.sum.toLocaleString()}
                </span>
              </li>
            );
          })}
        </ul>

        {/* 合計 */}
        <div className="mt-3 pt-3 border-t border-dashed border-[--color-border] flex items-baseline justify-between">
          <span className="text-xs font-bold flex items-center gap-1">
            <span>🌸</span>
            <span>合計</span>
          </span>
          <span className="font-display tabular-nums text-lg text-[--color-brand-deep]">
            ¥{expenseSum.toLocaleString()}
          </span>
        </div>
      </section>

      {/* ===== ツールバー ===== */}
      <div className="sticky top-0 z-10 bg-[--color-background]/95 backdrop-blur border-b border-[--color-border] py-3 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={save}
          disabled={savePending}
          className="btn btn-mint disabled:opacity-50"
        >
          {savePending ? "保存中..." : "保存"}
        </button>
        <button
          type="button"
          disabled={importPending}
          onClick={() => runImport(importActivity, "活動記録簿から")}
          className="btn btn-secondary btn-sm disabled:opacity-50"
        >
          活動記録簿から取り込み
        </button>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="app-input ml-2"
          title="経費種別で絞り込み"
        >
          <option value="">経費種別: すべて</option>
          {CATEGORIES.filter((c) => c).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          placeholder="絞り込み（内容・支払先・備考）"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="app-input"
        />
        {(filter || categoryFilter) && (
          <button
            type="button"
            onClick={() => {
              setFilter("");
              setCategoryFilter("");
            }}
            className="btn btn-ghost btn-sm"
          >
            クリア
          </button>
        )}
        <div className="ml-auto text-xs text-[--color-muted]">
          {visible.length}/{rows.length}行 · 収入{" "}
          <span className="font-display tabular-nums">¥{incomeSum.toLocaleString()}</span> · 支出{" "}
          <span className="font-display tabular-nums">¥{expenseSum.toLocaleString()}</span> · 充当{" "}
          <span className="font-display tabular-nums">¥{allocSum.toLocaleString()}</span>
        </div>
      </div>

      {msg && (
        <div className="text-sm bg-[--color-brand-soft] border border-[--color-brand-light] rounded-lg p-2.5">
          {msg}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs border border-[--color-border]">
          <thead className="bg-[--color-surface-3] sticky top-[60px]">
            <tr>
              {[
                { key: "date" as const, label: "日付", w: "w-28" },
                { key: "category" as const, label: "経費種別", w: "w-28" },
                { key: "content" as const, label: "内容", w: "" },
                { key: "payee" as const, label: "支払先", w: "w-32" },
                { key: "incomeYen" as const, label: "収入", w: "w-20" },
                { key: "expenseYen" as const, label: "支出", w: "w-20" },
                { key: "allocationRatio" as const, label: "按分率(%)", w: "w-20" },
                { key: "allocatedYen" as const, label: "充当額", w: "w-20" },
                { key: "note" as const, label: "備考", w: "w-32" },
              ].map(({ key, label, w }) => (
                <th
                  key={key}
                  className={`border border-[--color-border] px-2 py-2 ${w} cursor-pointer hover:bg-[--color-brand-soft] select-none transition`}
                  onClick={() => toggleSort(key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {label} <span className="text-[10px]">{sortIcon(key)}</span>
                  </span>
                </th>
              ))}
              <th className="border border-[--color-border] px-1 py-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const i = rows.indexOf(r);
              const isFlash = flashRowId === r.id;
              return (
                <tr
                  key={r.id}
                  id={`ledger-row-${r.id}`}
                  className={`${r.sourceKey ? "bg-[--color-brand-soft]/30 " : ""}${isFlash ? "row-flash " : ""}`.trim()}
                >
                  <td className="border border-[--color-border] px-1 py-1">
                    <input
                      type="date"
                      value={r.date}
                      onChange={(e) => patch(i, { date: e.target.value })}
                      className="w-28 app-input text-xs"
                    />
                  </td>
                  <td className="border border-[--color-border] px-1 py-1">
                    <select
                      value={r.category}
                      onChange={(e) =>
                        patch(i, { category: e.target.value as ExpenseCategory | "" })
                      }
                      className="w-full app-input text-xs"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c || "(なし)"}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-[--color-border] px-1 py-1">
                    <input
                      value={r.content}
                      onChange={(e) => patch(i, { content: e.target.value })}
                      className="w-full app-input text-xs"
                    />
                  </td>
                  <td className="border border-[--color-border] px-1 py-1">
                    <input
                      value={r.payee}
                      onChange={(e) => patch(i, { payee: e.target.value })}
                      className="w-full app-input text-xs"
                    />
                  </td>
                  <td className="border border-[--color-border] px-1 py-1">
                    <input
                      type="number"
                      value={r.incomeYen}
                      onChange={(e) => patch(i, { incomeYen: Number(e.target.value) })}
                      className="w-full app-input text-xs text-right"
                    />
                  </td>
                  <td className="border border-[--color-border] px-1 py-1">
                    <input
                      type="number"
                      value={r.expenseYen}
                      onChange={(e) => patch(i, { expenseYen: Number(e.target.value) })}
                      className="w-full app-input text-xs text-right"
                    />
                  </td>
                  <td className="border border-[--color-border] px-1 py-1">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={Math.round((r.allocationRatio || 0) * 1000) / 10}
                        onChange={(e) =>
                          patch(i, { allocationRatio: Number(e.target.value) / 100 })
                        }
                        className="w-full app-input text-xs text-right pr-5"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-[--color-faint] pointer-events-none">
                        %
                      </span>
                    </div>
                  </td>
                  <td className="border border-[--color-border] px-1 py-1">
                    <input
                      type="number"
                      value={r.allocatedYen}
                      onChange={(e) => patch(i, { allocatedYen: Number(e.target.value) })}
                      className="w-full app-input text-xs text-right"
                    />
                  </td>
                  <td className="border border-[--color-border] px-1 py-1">
                    <input
                      value={r.note}
                      onChange={(e) => patch(i, { note: e.target.value })}
                      className="w-full app-input text-xs"
                    />
                  </td>
                  <td className="border border-[--color-border] px-1 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => setRows((a) => a.filter((x) => x.id !== r.id))}
                      className="text-[--color-mirai-red] hover:underline"
                      title="削除"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
            <tr>
              <td colSpan={10} className="px-1 py-3 text-center bg-[--color-surface-2]">
                <button type="button" onClick={addRow} className="btn btn-secondary btn-sm">
                  + 行追加
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
