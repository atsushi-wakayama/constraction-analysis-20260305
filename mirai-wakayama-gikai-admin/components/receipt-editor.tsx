"use client";

import { useState, useTransition } from "react";
import type { ExpenseCategory, Receipt } from "@/lib/types";

const CATEGORIES: ExpenseCategory[] = [
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

type Action = (form: FormData) => Promise<void>;

export function ReceiptEditor({
  initial,
  action,
  onDelete,
}: {
  initial: Receipt;
  action: Action;
  onDelete: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState({
    category: initial.category,
    date: initial.date,
    payee: initial.payee,
    totalYen: initial.totalYen,
    allocatedYen: initial.allocatedYen,
    description: initial.description,
    note: initial.note,
  });

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
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-sm">
          <span>経費の種別</span>
          <select
            name="category"
            value={state.category}
            onChange={(e) => setState({ ...state, category: e.target.value as ExpenseCategory })}
            className="mt-1 w-full app-input"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span>日付</span>
          <input
            type="date"
            name="date"
            value={state.date}
            onChange={(e) => setState({ ...state, date: e.target.value })}
            className="mt-1 w-full app-input"
          />
        </label>
        <label className="text-sm">
          <span>支払先</span>
          <input
            name="payee"
            value={state.payee}
            onChange={(e) => setState({ ...state, payee: e.target.value })}
            className="mt-1 w-full app-input"
          />
        </label>
        <label className="text-sm">
          <span>支払総額(円)</span>
          <input
            type="number"
            name="totalYen"
            value={state.totalYen}
            onChange={(e) => setState({ ...state, totalYen: Number(e.target.value) })}
            className="mt-1 w-full app-input"
          />
        </label>
        <label className="text-sm">
          <span>政務活動費充当額(円)</span>
          <input
            type="number"
            name="allocatedYen"
            value={state.allocatedYen}
            onChange={(e) => setState({ ...state, allocatedYen: Number(e.target.value) })}
            className="mt-1 w-full app-input"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span>支払内容・摘要</span>
          <input
            name="description"
            value={state.description}
            onChange={(e) => setState({ ...state, description: e.target.value })}
            className="mt-1 w-full app-input"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span>備考</span>
          <input
            name="note"
            value={state.note}
            onChange={(e) => setState({ ...state, note: e.target.value })}
            className="mt-1 w-full app-input"
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary disabled:opacity-50"
        >
          {pending ? "保存中..." : "保存"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm("この領収書を削除しますか？画像ファイルも削除されます。")) {
              startTransition(async () => {
                await onDelete();
              });
            }
          }}
          className="btn btn-danger-ghost btn-sm ml-auto"
        >
          削除
        </button>
      </div>
    </form>
  );
}
