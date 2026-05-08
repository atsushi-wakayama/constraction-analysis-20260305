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
}: {
  initial: LedgerEntry[];
  fiscalYear: number;
  saveAction: SaveAction;
  importActivity: ImportAction;
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
    const DEFAULTS: Record<string, string> = {
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
    return ROWS.map((r) => {
      const sum = rows
        .filter((e) => e.category === r.internal)
        .reduce((s, e) => s + (e.allocatedYen || 0), 0);
      return {
        label: r.label,
        sum,
        breakdown: sum > 0 ? DEFAULTS[r.internal] ?? "" : "",
      };
    });
  }, [rows]);

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
      {/* ===== 集計プレビュー ===== */}
      <section className="app-card p-4">
        <h3 className="section-title mb-3">
          <span>経費別集計プレビュー</span>
          <small>編集中の値で報告書がどうなるか</small>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
          <table className="w-full border-collapse text-sm border border-[--color-foreground]">
            <thead>
              <tr>
                <th className="border border-[--color-foreground] px-2 py-1.5 w-32 text-center">経　費</th>
                <th className="border border-[--color-foreground] px-2 py-1.5 w-28 text-center">支出額</th>
                <th className="border border-[--color-foreground] px-2 py-1.5 text-center">主たる支出の内訳</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.map((r) => (
                <tr key={r.label}>
                  <td className="border border-[--color-foreground] px-2 py-1.5 text-center">{r.label}</td>
                  <td className="border border-[--color-foreground] px-2 py-1.5 text-right tabular-nums font-mono">
                    {r.sum.toLocaleString()}
                  </td>
                  <td className="border border-[--color-foreground] px-3 py-1.5 text-xs text-[--color-muted]">
                    {r.breakdown}
                  </td>
                </tr>
              ))}
              <tr className="bg-[--color-surface-3]">
                <td className="border border-[--color-foreground] px-2 py-1.5 text-center font-bold">合　計</td>
                <td className="border border-[--color-foreground] px-2 py-1.5 text-right tabular-nums font-mono font-bold">
                  {expenseSum.toLocaleString()}
                </td>
                <td className="border border-[--color-foreground] px-3 py-1.5"></td>
              </tr>
            </tbody>
          </table>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:w-44">
            <div className="app-stat app-stat-mint">
              <div className="app-stat-label">収入</div>
              <div className="app-stat-value">¥{incomeSum.toLocaleString()}</div>
            </div>
            <div className="app-stat">
              <div className="app-stat-label">残余</div>
              <div className="app-stat-value">¥{(incomeSum - expenseSum).toLocaleString()}</div>
              <div
                className={
                  "app-stat-sub " +
                  (incomeSum - expenseSum >= 0
                    ? "text-[--color-mirai-green-deep]"
                    : "text-[--color-mirai-red]")
                }
              >
                {incomeSum - expenseSum >= 0 ? "繰越予定" : "超過"}
              </div>
            </div>
          </div>
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
