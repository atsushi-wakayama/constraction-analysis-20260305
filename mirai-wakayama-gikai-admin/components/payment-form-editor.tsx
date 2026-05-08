"use client";

import { useState, useTransition } from "react";
import type { PaymentCertificate, PaymentEntry } from "@/lib/types";

type Action = (form: FormData) => Promise<void>;

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

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function blank(): PaymentEntry {
  return {
    id: uid(),
    date: "",
    totalYen: 0,
    payee: "ガソリン代",
    description: "",
    allocatedYen: 0,
    note: "",
  };
}

export function PaymentFormEditor({
  initial,
  action,
  onDelete,
  linkedActivityId,
}: {
  initial: PaymentCertificate | null;
  action: Action;
  onDelete?: () => Promise<void>;
  linkedActivityId?: string;
}) {
  const [header, setHeader] = useState({
    category: initial?.category ?? "調査研究費",
    certifiedDate: initial?.certifiedDate ?? "",
    signerName: initial?.signerName ?? "岩永 淳志",
    factionName: initial?.factionName ?? "みらいの会",
    representativeName: initial?.representativeName ?? "岩永 淳志",
  });
  const [entries, setEntries] = useState<PaymentEntry[]>(
    initial?.entries.length ? initial.entries : [blank()],
  );
  const [pending, startTransition] = useTransition();

  function patch(i: number, p: Partial<PaymentEntry>) {
    setEntries((arr) => arr.map((e, idx) => (idx === i ? { ...e, ...p } : e)));
  }

  function submit(formEl: HTMLFormElement) {
    const fd = new FormData(formEl);
    startTransition(async () => {
      await action(fd);
    });
  }

  const total = entries.reduce((s, e) => s + (Number(e.allocatedYen) || 0), 0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(e.currentTarget);
      }}
      className="space-y-6"
    >
      <input type="hidden" name="category" value={header.category} />
      <input type="hidden" name="certifiedDate" value={header.certifiedDate} />
      <input type="hidden" name="signerName" value={header.signerName} />
      <input type="hidden" name="factionName" value={header.factionName} />
      <input type="hidden" name="representativeName" value={header.representativeName} />
      {linkedActivityId && (
        <input type="hidden" name="linkedActivityId" value={linkedActivityId} />
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3 no-print">
        <label className="block text-sm">
          <span>経費の種別</span>
          <select
            value={header.category}
            onChange={(e) => setHeader({ ...header, category: e.target.value as typeof header.category })}
            className="mt-1 w-full app-input"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span>証明日</span>
          <input
            type="date"
            value={header.certifiedDate}
            onChange={(e) => setHeader({ ...header, certifiedDate: e.target.value })}
            className="mt-1 w-full app-input"
          />
        </label>
        <label className="block text-sm">
          <span>氏名</span>
          <input
            value={header.signerName}
            onChange={(e) => setHeader({ ...header, signerName: e.target.value })}
            className="mt-1 w-full app-input"
          />
        </label>
        <label className="block text-sm">
          <span>会派名</span>
          <input
            value={header.factionName}
            onChange={(e) => setHeader({ ...header, factionName: e.target.value })}
            className="mt-1 w-full app-input"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span>代表者名</span>
          <input
            value={header.representativeName}
            onChange={(e) => setHeader({ ...header, representativeName: e.target.value })}
            className="mt-1 w-full app-input"
          />
        </label>
      </section>

      <PaymentEntriesAccordion
        entries={entries}
        patch={patch}
        addRow={() => setEntries((a) => [...a, blank()])}
        delRow={(idx) => setEntries((a) => a.filter((_, i) => i !== idx))}
        total={total}
      />

      <div className="flex items-center gap-3 no-print">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary disabled:opacity-50"
        >
          {pending ? "保存中..." : "保存"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn btn-secondary"
        >
          印刷プレビュー
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={() => {
              if (confirm("この書類を削除しますか？")) {
                startTransition(async () => {
                  await onDelete();
                });
              }
            }}
            className="btn btn-danger-ghost btn-sm ml-auto"
          >
            この書類を削除
          </button>
        )}
      </div>
    </form>
  );
}

const ROWS_PER_SECTION = 12;

function PaymentEntriesAccordion({
  entries,
  patch,
  addRow,
  delRow,
  total,
}: {
  entries: PaymentEntry[];
  patch: (i: number, p: Partial<PaymentEntry>) => void;
  addRow: () => void;
  delRow: (i: number) => void;
  total: number;
}) {
  const sections: { from: number; to: number }[] = [];
  for (let i = 0; i < Math.max(1, entries.length); i += ROWS_PER_SECTION) {
    sections.push({ from: i, to: Math.min(i + ROWS_PER_SECTION, entries.length) });
  }
  const [open, setOpen] = useState<Set<number>>(() => new Set(sections.map((_, i) => i)));

  function toggle(idx: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return (
    <section className="space-y-3 no-print">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="section-title">
          <span>明細</span>
          <small>
            {entries.length}件 / {sections.length}セクション / 充当合計{" "}
            <span className="font-display tabular-nums text-[--color-foreground]">
              ¥{total.toLocaleString()}
            </span>
          </small>
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOpen(new Set(sections.map((_, i) => i)))}
            className="btn btn-ghost btn-sm"
          >
            全展開
          </button>
          <button
            type="button"
            onClick={() => setOpen(new Set())}
            className="btn btn-ghost btn-sm"
          >
            全折りたたみ
          </button>
        </div>
      </div>

      {sections.map((sec, sectionIdx) => {
        const slice = entries.slice(sec.from, sec.to);
        const sectionTotal = slice.reduce((s, e) => s + (Number(e.allocatedYen) || 0), 0);
        const isOpen = open.has(sectionIdx);
        return (
          <div key={sectionIdx} className="app-card overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(sectionIdx)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-[--color-surface-2] text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-display text-[--color-brand] text-sm">
                  明細 {sectionIdx + 1}
                </span>
                <span className="text-xs text-[--color-faint]">
                  {sec.from + 1}〜{sec.to} 件目 ・ {slice.length}件 ・ 充当{" "}
                  <span className="font-display tabular-nums text-[--color-foreground]">
                    ¥{sectionTotal.toLocaleString()}
                  </span>
                </span>
              </div>
              <span className="text-[--color-faint] text-sm">{isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && (
              <div className="overflow-x-auto border-t border-[--color-border]">
                <table className="min-w-full text-sm">
                  <thead className="bg-[--color-surface-3]">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs">日付</th>
                      <th className="px-2 py-2 text-left text-xs">支払総額</th>
                      <th className="px-2 py-2 text-left text-xs">支払先</th>
                      <th className="px-2 py-2 text-left text-xs">支払内容</th>
                      <th className="px-2 py-2 text-left text-xs">充当額</th>
                      <th className="px-2 py-2 text-left text-xs">備考</th>
                      <th className="px-2 py-2 text-xs w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {slice.map((e, k) => {
                      const i = sec.from + k;
                      return (
                        <tr key={e.id} className="border-t border-[--color-border]">
                          <td className="px-2 py-1">
                            <input type="hidden" name="entry_id" value={e.id} />
                            <input
                              type="date"
                              name="entry_date"
                              value={e.date}
                              onChange={(ev) => patch(i, { date: ev.target.value })}
                              className="app-input text-xs"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              name="entry_total"
                              value={e.totalYen}
                              onChange={(ev) =>
                                patch(i, { totalYen: Number(ev.target.value) })
                              }
                              className="app-input text-xs w-24 text-right"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              name="entry_payee"
                              value={e.payee}
                              onChange={(ev) => patch(i, { payee: ev.target.value })}
                              className="app-input text-xs w-28"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <textarea
                              name="entry_description"
                              value={e.description}
                              onChange={(ev) =>
                                patch(i, { description: ev.target.value })
                              }
                              rows={2}
                              className="app-input text-xs w-72"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              name="entry_allocated"
                              value={e.allocatedYen}
                              onChange={(ev) =>
                                patch(i, { allocatedYen: Number(ev.target.value) })
                              }
                              className="app-input text-xs w-24 text-right"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              name="entry_note"
                              value={e.note}
                              onChange={(ev) => patch(i, { note: ev.target.value })}
                              className="app-input text-xs w-36"
                            />
                          </td>
                          <td className="px-2 py-1 text-center">
                            <button
                              type="button"
                              onClick={() => delRow(i)}
                              className="text-[--color-mirai-red] text-xs hover:underline"
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
      <div className="text-center">
        <button type="button" onClick={addRow} className="btn btn-secondary btn-sm">
          + 行追加（末尾）
        </button>
      </div>
    </section>
  );
}
