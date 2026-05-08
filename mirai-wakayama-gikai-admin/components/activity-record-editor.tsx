"use client";

import { useState, useTransition } from "react";
import type { ActivityExpense, ActivityRecord } from "@/lib/types";

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

function blank(): ActivityExpense {
  return {
    id: uid(),
    category: "調査研究費",
    description: "",
    totalYen: 0,
    allocatedYen: 0,
    note: "",
    payee: "",
    addToCert: false,
  };
}

export function ActivityRecordEditor({
  initial,
  action,
  onDelete,
}: {
  initial: ActivityRecord | null;
  action: Action;
  onDelete?: () => Promise<void>;
}) {
  const [header, setHeader] = useState({
    factionMemberName: initial?.factionMemberName ?? "岩永 淳志",
    implementationDate: initial?.implementationDate ?? "",
    location: initial?.location ?? "",
    participants: initial?.participants ?? "",
    purposeContent: initial?.purposeContent ?? "",
    outOfPrefecture: initial?.outOfPrefecture ?? true,
  });
  const [expenses, setExpenses] = useState<ActivityExpense[]>(
    initial?.expenses?.length ? initial.expenses : [blank()],
  );
  const [pending, startTransition] = useTransition();

  function patch(i: number, p: Partial<ActivityExpense>) {
    setExpenses((arr) => arr.map((e, idx) => (idx === i ? { ...e, ...p } : e)));
  }

  const totalSum = expenses.reduce((s, e) => s + (Number(e.totalYen) || 0), 0);
  const allocSum = expenses.reduce((s, e) => s + (Number(e.allocatedYen) || 0), 0);

  function submit(formEl: HTMLFormElement) {
    const fd = new FormData(formEl);
    startTransition(async () => {
      await action(fd);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(e.currentTarget);
      }}
      className="space-y-6"
    >
      <input type="hidden" name="factionMemberName" value={header.factionMemberName} />
      <input type="hidden" name="implementationDate" value={header.implementationDate} />
      <input type="hidden" name="location" value={header.location} />
      <input type="hidden" name="participants" value={header.participants} />
      <input type="hidden" name="purposeContent" value={header.purposeContent} />
      <input type="hidden" name="outOfPrefecture" value={header.outOfPrefecture ? "1" : "0"} />

      <section className="no-print">
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={header.outOfPrefecture}
            onChange={(e) => setHeader({ ...header, outOfPrefecture: e.target.checked })}
            className="w-4 h-4 accent-[--color-brand]"
          />
          <span className="font-medium">県外調査として管理する</span>
          <span className="text-xs text-[--color-faint]">
            （支払証明書・領収書を別ファイルでまとめる）
          </span>
        </label>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3 no-print">
        <label className="block text-sm md:col-span-2">
          <span>会派（議員）名</span>
          <input
            value={header.factionMemberName}
            onChange={(e) => setHeader({ ...header, factionMemberName: e.target.value })}
            className="mt-1 w-full app-input"
          />
        </label>
        <label className="block text-sm">
          <span>実施日（自由記述：例 9月26日〜27日）</span>
          <input
            value={header.implementationDate}
            onChange={(e) => setHeader({ ...header, implementationDate: e.target.value })}
            className="mt-1 w-full app-input"
            placeholder="例: 2026年1月9日〜10日"
          />
        </label>
        <label className="block text-sm">
          <span>実施場所</span>
          <input
            value={header.location}
            onChange={(e) => setHeader({ ...header, location: e.target.value })}
            className="mt-1 w-full app-input"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span>参加者又は対象者</span>
          <input
            value={header.participants}
            onChange={(e) => setHeader({ ...header, participants: e.target.value })}
            className="mt-1 w-full app-input"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span>目的、内容及び結果等</span>
          <textarea
            value={header.purposeContent}
            onChange={(e) => setHeader({ ...header, purposeContent: e.target.value })}
            rows={14}
            className="mt-1 w-full border rounded px-2 py-1 font-sans"
          />
        </label>
      </section>

      <section className="space-y-2 no-print">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold">
            活動に要した支出（{expenses.length}件 / 総経費 ¥{totalSum.toLocaleString()} / 政務活動対象 ¥{allocSum.toLocaleString()}）
          </h3>
        </div>
        <p className="text-xs text-[--color-muted]">
          💡「証明書へ」にチェックを入れた行は、保存時に
          <span className="text-[--color-brand] font-medium">
            この活動に紐付く支払証明書（経費種別ごとに1ファイル）
          </span>
          へ自動転記されます。チェックを外すと、その行は次回保存時に証明書から削除されます。
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-[--color-surface-3]">
              <tr>
                <th className="border px-2 py-1">経費の種別</th>
                <th className="border px-2 py-1">主な支出内容</th>
                <th className="border px-2 py-1">支払先</th>
                <th className="border px-2 py-1">総経費(円)</th>
                <th className="border px-2 py-1">政務活動対象(円)</th>
                <th className="border px-2 py-1">備考</th>
                <th className="border px-2 py-1 bg-[--color-brand-soft]">
                  証明書へ
                  <div className="text-[10px] font-normal text-[--color-faint] leading-tight">
                    保存時に自動転記
                  </div>
                </th>
                <th className="border px-2 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e, i) => (
                <tr key={e.id} className={e.addToCert ? "bg-[--color-brand-soft]/40" : ""}>
                  <td className="border px-1 py-1">
                    <input type="hidden" name="expense_id" value={e.id} />
                    <select
                      name="expense_category"
                      value={e.category || "調査研究費"}
                      onChange={(ev) => patch(i, { category: ev.target.value })}
                      className="w-28 border rounded px-1"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border px-1 py-1">
                    <textarea
                      name="expense_description"
                      value={e.description}
                      onChange={(ev) => patch(i, { description: ev.target.value })}
                      rows={2}
                      className="w-72 border rounded px-1"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      name="expense_payee"
                      value={e.payee ?? ""}
                      onChange={(ev) => patch(i, { payee: ev.target.value })}
                      placeholder="例: JAL/JR西"
                      className="w-28 border rounded px-1"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="number"
                      name="expense_total"
                      value={e.totalYen}
                      onChange={(ev) => patch(i, { totalYen: Number(ev.target.value) })}
                      className="w-24 border rounded px-1 text-right"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="number"
                      name="expense_allocated"
                      value={e.allocatedYen}
                      onChange={(ev) => patch(i, { allocatedYen: Number(ev.target.value) })}
                      className="w-24 border rounded px-1 text-right"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      name="expense_note"
                      value={e.note}
                      onChange={(ev) => patch(i, { note: ev.target.value })}
                      className="w-32 border rounded px-1"
                    />
                  </td>
                  <td className="border px-1 py-1 text-center bg-[--color-brand-soft]/30">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="expense_addToCert"
                        value={e.id}
                        checked={!!e.addToCert}
                        onChange={(ev) => patch(i, { addToCert: ev.target.checked })}
                        className="w-4 h-4 accent-[--color-brand]"
                      />
                    </label>
                  </td>
                  <td className="border px-1 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => setExpenses((a) => a.filter((_, idx) => idx !== i))}
                      className="text-[--color-mirai-red] text-xs hover:underline"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={8} className="border px-2 py-2 text-center bg-[--color-surface-2]">
                  <button
                    type="button"
                    onClick={() => setExpenses((a) => [...a, blank()])}
                    className="btn btn-secondary btn-sm"
                  >
                    + 行追加
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

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
              if (confirm("この活動記録を削除しますか？")) {
                startTransition(async () => {
                  await onDelete();
                });
              }
            }}
            className="btn btn-danger-ghost btn-sm ml-auto"
          >
            この記録を削除
          </button>
        )}
      </div>
    </form>
  );
}
