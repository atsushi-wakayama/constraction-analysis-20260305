"use client";

import { useState, useTransition } from "react";
import { ActivityRecordPrintView } from "@/components/activity-record-print-view";
import type { ActivityExpense, ActivityRecord } from "@/lib/types";

type Action = (form: FormData) => Promise<void>;

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function blankExpense(): ActivityExpense {
  return {
    id: uid(),
    category: "調査研究費",
    description: "",
    totalYen: 0,
    allocatedYen: 0,
    note: "",
  };
}

function blankRecord(fiscalYear: number): ActivityRecord {
  const now = new Date().toISOString();
  return {
    id: uid(),
    fiscalYear,
    factionMemberName: "岩永 淳志",
    implementationDate: "",
    location: "",
    participants: "",
    purposeContent: "",
    expenses: [blankExpense()],
    createdAt: now,
    updatedAt: now,
  };
}

export function CombinedActivityEditor({
  initial,
  action,
  fiscalYear,
}: {
  initial: ActivityRecord[];
  action: Action;
  fiscalYear: number;
}) {
  const [records, setRecords] = useState<ActivityRecord[]>(
    initial.length ? initial : [blankRecord(fiscalYear)],
  );
  const [pending, startTransition] = useTransition();

  function patchRec(i: number, p: Partial<ActivityRecord>) {
    setRecords((arr) => arr.map((r, idx) => (idx === i ? { ...r, ...p } : r)));
  }

  function patchExp(ri: number, ei: number, p: Partial<ActivityExpense>) {
    setRecords((arr) =>
      arr.map((r, idx) =>
        idx === ri
          ? { ...r, expenses: r.expenses.map((e, j) => (j === ei ? { ...e, ...p } : e)) }
          : r,
      ),
    );
  }

  function addRow(ri: number) {
    setRecords((arr) =>
      arr.map((r, idx) => (idx === ri ? { ...r, expenses: [...r.expenses, blankExpense()] } : r)),
    );
  }

  function delRow(ri: number, ei: number) {
    setRecords((arr) =>
      arr.map((r, idx) =>
        idx === ri ? { ...r, expenses: r.expenses.filter((_, j) => j !== ei) } : r,
      ),
    );
  }

  function moveRecord(i: number, dir: -1 | 1) {
    setRecords((arr) => {
      const next = [...arr];
      const j = i + dir;
      if (j < 0 || j >= next.length) return arr;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function delRecord(i: number) {
    if (!confirm("この記録を削除しますか？（保存ボタンで確定されます）")) return;
    setRecords((arr) => arr.filter((_, idx) => idx !== i));
  }

  function addRecord() {
    setRecords((arr) => [...arr, blankRecord(fiscalYear)]);
  }

  function save(formEl: HTMLFormElement) {
    const fd = new FormData(formEl);
    fd.set("payload", JSON.stringify(records));
    fd.set("fiscalYear", String(fiscalYear));
    startTransition(async () => {
      await action(fd);
    });
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(e.currentTarget);
        }}
      >
        <input type="hidden" name="payload" value="" />
        <input type="hidden" name="fiscalYear" value={fiscalYear} />

        <div className="sticky top-0 bg-white/95 backdrop-blur z-10 border-b py-3 mb-4 flex items-center gap-3 no-print">
          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary disabled:opacity-50"
          >
            {pending ? "保存中..." : "全記録を保存"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-secondary"
          >
            まとめて印刷
          </button>
          <button
            type="button"
            onClick={addRecord}
            className="btn btn-secondary ml-auto"
          >
            + 記録を追加
          </button>
        </div>

        <div className="space-y-8 no-print">
          {records.map((r, ri) => {
            const totalSum = r.expenses.reduce((s, e) => s + (Number(e.totalYen) || 0), 0);
            const allocSum = r.expenses.reduce((s, e) => s + (Number(e.allocatedYen) || 0), 0);
            return (
              <fieldset key={r.id} className="border rounded p-4 space-y-3">
                <legend className="px-2 text-sm font-medium flex items-center gap-2">
                  <span>記録 #{ri + 1}</span>
                  <button
                    type="button"
                    onClick={() => moveRecord(ri, -1)}
                    disabled={ri === 0}
                    className="text-xs px-1 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveRecord(ri, 1)}
                    disabled={ri === records.length - 1}
                    className="text-xs px-1 disabled:opacity-30"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => delRecord(ri)}
                    className="text-xs text-red-600 ml-2"
                  >
                    削除
                  </button>
                </legend>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="text-sm md:col-span-2">
                    <span>会派（議員）名</span>
                    <input
                      value={r.factionMemberName}
                      onChange={(e) => patchRec(ri, { factionMemberName: e.target.value })}
                      className="mt-1 w-full app-input"
                    />
                  </label>
                  <label className="text-sm">
                    <span>実施日</span>
                    <input
                      value={r.implementationDate}
                      onChange={(e) => patchRec(ri, { implementationDate: e.target.value })}
                      className="mt-1 w-full app-input"
                      placeholder="例: 2026年1月9日〜10日"
                    />
                  </label>
                  <label className="text-sm">
                    <span>実施場所</span>
                    <input
                      value={r.location}
                      onChange={(e) => patchRec(ri, { location: e.target.value })}
                      className="mt-1 w-full app-input"
                    />
                  </label>
                  <label className="text-sm md:col-span-2">
                    <span>参加者又は対象者</span>
                    <input
                      value={r.participants}
                      onChange={(e) => patchRec(ri, { participants: e.target.value })}
                      className="mt-1 w-full app-input"
                    />
                  </label>
                  <label className="text-sm md:col-span-2">
                    <span>目的、内容及び結果等</span>
                    <textarea
                      value={r.purposeContent}
                      onChange={(e) => patchRec(ri, { purposeContent: e.target.value })}
                      rows={10}
                      className="mt-1 w-full app-input"
                    />
                  </label>
                </div>

                <div>
                  <div className="mb-1">
                    <h4 className="text-sm font-medium">
                      支出（{r.expenses.length}件 / 総 ¥{totalSum.toLocaleString()} / 対象 ¥{allocSum.toLocaleString()}）
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border px-1 py-1">経費種別</th>
                          <th className="border px-1 py-1">主な支出内容</th>
                          <th className="border px-1 py-1">総経費</th>
                          <th className="border px-1 py-1">政務活動対象</th>
                          <th className="border px-1 py-1">備考</th>
                          <th className="border px-1 py-1"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.expenses.map((e, ei) => (
                          <tr key={e.id}>
                            <td className="border px-1 py-1">
                              <input
                                value={e.category}
                                onChange={(ev) => patchExp(ri, ei, { category: ev.target.value })}
                                className="w-24 border rounded px-1"
                              />
                            </td>
                            <td className="border px-1 py-1">
                              <textarea
                                value={e.description}
                                onChange={(ev) =>
                                  patchExp(ri, ei, { description: ev.target.value })
                                }
                                rows={2}
                                className="w-64 border rounded px-1"
                              />
                            </td>
                            <td className="border px-1 py-1">
                              <input
                                type="number"
                                value={e.totalYen}
                                onChange={(ev) =>
                                  patchExp(ri, ei, { totalYen: Number(ev.target.value) })
                                }
                                className="w-20 border rounded px-1 text-right"
                              />
                            </td>
                            <td className="border px-1 py-1">
                              <input
                                type="number"
                                value={e.allocatedYen}
                                onChange={(ev) =>
                                  patchExp(ri, ei, { allocatedYen: Number(ev.target.value) })
                                }
                                className="w-20 border rounded px-1 text-right"
                              />
                            </td>
                            <td className="border px-1 py-1">
                              <input
                                value={e.note}
                                onChange={(ev) => patchExp(ri, ei, { note: ev.target.value })}
                                className="w-28 border rounded px-1"
                              />
                            </td>
                            <td className="border px-1 py-1 text-center">
                              <button
                                type="button"
                                onClick={() => delRow(ri, ei)}
                                className="text-[--color-mirai-red] text-xs hover:underline"
                              >
                                削除
                              </button>
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={6} className="border px-1 py-2 text-center bg-[--color-surface-2]">
                            <button
                              type="button"
                              onClick={() => addRow(ri)}
                              className="btn btn-secondary btn-sm"
                            >
                              + 行追加
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </fieldset>
            );
          })}
        </div>
      </form>

      <section className="border-t pt-6">
        <h2 className="text-sm text-gray-500 mb-3 no-print">印刷プレビュー（{records.length}枚）</h2>
        <div className="space-y-6">
          {records.map((r) => (
            <ActivityRecordPrintView key={r.id} rec={r} />
          ))}
        </div>
      </section>
    </div>
  );
}
