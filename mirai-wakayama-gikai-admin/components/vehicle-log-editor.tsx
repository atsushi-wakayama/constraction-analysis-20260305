"use client";

import { useState, useTransition } from "react";
import type { ExpenseCategory, VehicleTrip } from "@/lib/types";

type Action = (form: FormData) => Promise<void>;
type RegenAction = (form: FormData) => Promise<{ category: string; count: number; sumYen: number }[] | void>;

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

const KM_TO_YEN = 20;

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function blank(year: number, month: number, dateStr?: string): VehicleTrip {
  return {
    id: uid(),
    fiscalYear: year,
    month,
    date: dateStr ?? "",
    purpose: "",
    totalKm: 0,
    businessKm: 0,
    category: "調査研究費",
    note: "",
  };
}

function daysInCalMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function calendarYearForFiscal(fiscalYear: number, month: number) {
  // 4-12月 → fiscalYear, 1-3月 → fiscalYear+1
  return month >= 4 ? fiscalYear : fiscalYear + 1;
}

export function VehicleLogEditor({
  initial,
  fiscalYear,
  month,
  saveAction,
  regenAction,
}: {
  initial: VehicleTrip[];
  fiscalYear: number;
  month: number;
  saveAction: Action;
  regenAction: RegenAction;
}) {
  // 月の全日付を表示（既存があればその内容、無ければ空行）
  const calYear = calendarYearForFiscal(fiscalYear, month);
  const days = daysInCalMonth(calYear, month);
  const byDate = new Map<string, VehicleTrip>();
  for (const t of initial) byDate.set(t.date, t);
  const initialRows: VehicleTrip[] = Array.from({ length: days }, (_, i) => {
    const d = `${calYear}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
    return byDate.get(d) ?? blank(fiscalYear, month, d);
  });

  const [rows, setRows] = useState<VehicleTrip[]>(initialRows);
  const [savePending, startSave] = useTransition();
  const [regenPending, startRegen] = useTransition();
  const [regenResult, setRegenResult] = useState<string | null>(null);

  function patch(i: number, p: Partial<VehicleTrip>) {
    setRows((arr) => arr.map((r, idx) => (idx === i ? { ...r, ...p } : r)));
  }

  const totalKm = rows.reduce((s, r) => s + (Number(r.totalKm) || 0), 0);
  const businessKm = rows.reduce((s, r) => s + (Number(r.businessKm) || 0), 0);
  const allocSum = Math.round(businessKm * KM_TO_YEN);

  function save() {
    const fd = new FormData();
    fd.set("month", String(month));
    fd.set("fiscalYear", String(fiscalYear));
    // 政務活動分が0かつ目的空の行は省く
    const filtered = rows.filter(
      (r) => r.businessKm > 0 || r.totalKm > 0 || r.purpose.trim() || r.note.trim(),
    );
    fd.set("payload", JSON.stringify(filtered));
    startSave(async () => {
      await saveAction(fd);
    });
  }

  function regenerate() {
    if (!confirm(`${fiscalYear}年度 全月の trip から経費種別ごとに支払証明書を再生成します。\n各経費種別1ファイル（年度全体）にまとめられ、同年度・同種別の自動生成済みは上書きされます。続行しますか？`)) {
      return;
    }
    const fd = new FormData();
    fd.set("month", String(month));
    fd.set("fiscalYear", String(fiscalYear));
    setRegenResult(null);
    startRegen(async () => {
      const r = await regenAction(fd);
      if (Array.isArray(r) && r.length > 0) {
        setRegenResult(
          r
            .map((x) => `${x.category}: ${x.count}件 / 計¥${x.sumYen.toLocaleString()}`)
            .join(" / "),
        );
      } else if (Array.isArray(r)) {
        setRegenResult("対象の trip がありません（政務活動km=0）");
      } else {
        setRegenResult("再生成しました");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b py-3 flex items-center gap-2 flex-wrap no-print">
        <button
          type="button"
          onClick={save}
          disabled={savePending}
          className="btn btn-primary disabled:opacity-50"
        >
          {savePending ? "保存中..." : "保存"}
        </button>
        <button
          type="button"
          onClick={regenerate}
          disabled={regenPending || savePending}
          className="btn btn-secondary disabled:opacity-50"
          title="先に保存してから再生成すると確実です"
        >
          {regenPending ? "再生成中..." : "支払証明書を再生成"}
        </button>
        <div className="ml-auto text-xs text-gray-600">
          総走行 {totalKm.toFixed(1)}km / 政務活動 {businessKm.toFixed(1)}km / 充当 ¥{allocSum.toLocaleString()}
        </div>
      </div>

      {regenResult && (
        <div className="text-sm bg-amber-50 border border-amber-200 rounded p-2">
          {regenResult}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs border">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-1 py-1 w-28">使用日</th>
              <th className="border px-1 py-1">目的及び行程</th>
              <th className="border px-1 py-1 w-16">総km</th>
              <th className="border px-1 py-1 w-16">政務km</th>
              <th className="border px-1 py-1 w-20">充当額</th>
              <th className="border px-1 py-1 w-28">経費種別</th>
              <th className="border px-1 py-1 w-28">備考</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const yen = Math.round((Number(r.businessKm) || 0) * KM_TO_YEN);
              const dow = r.date ? "日月火水木金土"[new Date(r.date).getDay()] : "";
              return (
                <tr key={r.id}>
                  <td className="border px-1 py-1 text-center">
                    <input
                      type="date"
                      value={r.date}
                      onChange={(e) => patch(i, { date: e.target.value })}
                      className="w-28 border rounded px-1 text-xs"
                    />
                    <div className="text-[10px] text-gray-500">{dow}</div>
                  </td>
                  <td className="border px-1 py-1">
                    <textarea
                      value={r.purpose}
                      onChange={(e) => patch(i, { purpose: e.target.value })}
                      rows={1}
                      className="w-full border rounded px-1"
                      placeholder="例: 政務調査（県庁）、〇〇への参加（〇〇）"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="number"
                      step="0.1"
                      value={r.totalKm}
                      onChange={(e) => patch(i, { totalKm: Number(e.target.value) })}
                      className="w-14 border rounded px-1 text-right"
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      type="number"
                      step="0.1"
                      value={r.businessKm}
                      onChange={(e) => patch(i, { businessKm: Number(e.target.value) })}
                      className="w-14 border rounded px-1 text-right"
                    />
                  </td>
                  <td className="border px-1 py-1 text-right text-gray-700">
                    ¥{yen.toLocaleString()}
                  </td>
                  <td className="border px-1 py-1">
                    <select
                      value={r.category}
                      onChange={(e) => patch(i, { category: e.target.value as ExpenseCategory })}
                      className="w-full border rounded px-1"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border px-1 py-1">
                    <input
                      value={r.note}
                      onChange={(e) => patch(i, { note: e.target.value })}
                      className="w-full border rounded px-1"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
