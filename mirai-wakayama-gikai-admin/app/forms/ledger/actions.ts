"use server";

import { revalidatePath } from "next/cache";
import {
  appendLedgerEntries,
  listActivitiesByYear,
  listCertificatesByYear,
  replaceLedgerForYear,
} from "@/lib/storage";
import { getActiveYear } from "@/lib/active-year";
import type { ExpenseCategory, LedgerEntry } from "@/lib/types";

const ALLOWED_CATEGORIES: ExpenseCategory[] = [
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

function num(v: unknown): number {
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function pickCategory(s: string): ExpenseCategory | "" {
  if (!s) return "";
  return ALLOWED_CATEGORIES.includes(s as ExpenseCategory)
    ? (s as ExpenseCategory)
    : "";
}

export async function saveLedgerAction(form: FormData) {
  const yearForm = Number(form.get("fiscalYear"));
  const year =
    Number.isFinite(yearForm) && yearForm > 0 ? yearForm : await getActiveYear();
  const payload = String(form.get("payload") ?? "[]");
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    throw new Error("ペイロードが不正です");
  }
  if (!Array.isArray(parsed)) throw new Error("配列である必要があります");
  const entries: LedgerEntry[] = parsed.map((r: Record<string, unknown>) => ({
    id: String(r.id ?? ""),
    fiscalYear: year,
    date: String(r.date ?? ""),
    category: pickCategory(String(r.category ?? "")),
    content: String(r.content ?? ""),
    payee: String(r.payee ?? ""),
    incomeYen: num(r.incomeYen),
    expenseYen: num(r.expenseYen),
    allocationRatio: Number.isFinite(Number(r.allocationRatio)) ? Number(r.allocationRatio) : 1,
    allocatedYen: num(r.allocatedYen),
    note: String(r.note ?? ""),
    sourceKey: r.sourceKey ? String(r.sourceKey) : undefined,
  }));
  await replaceLedgerForYear(year, entries);
  revalidatePath("/");
  revalidatePath("/forms/ledger");
  revalidatePath("/forms/ledger/report");
}

export async function importFromActivityAction(): Promise<{ added: number; skipped: number }> {
  const year = await getActiveYear();
  const records = await listActivitiesByYear(year);
  const entries: LedgerEntry[] = [];
  for (const rec of records) {
    const date = dateOnly(rec.implementationDate, year);
    for (const exp of rec.expenses) {
      if (!exp.allocatedYen && !exp.totalYen) continue;
      const cat = pickCategory(exp.category);
      entries.push({
        id: "",
        fiscalYear: year,
        date,
        category: cat,
        content: exp.description || rec.implementationDate,
        payee: "",
        incomeYen: 0,
        expenseYen: exp.totalYen,
        allocationRatio: exp.totalYen > 0 ? exp.allocatedYen / exp.totalYen : 1,
        allocatedYen: exp.allocatedYen,
        note: `活動記録: ${rec.location || ""}`.trim(),
        sourceKey: `activity:${rec.id}:${exp.id}`,
      });
    }
  }
  const result = await appendLedgerEntries(year, entries);
  revalidatePath("/forms/ledger");
  revalidatePath("/forms/ledger/report");
  return result;
}

export async function importFromPaymentCertAction(): Promise<{ added: number; skipped: number }> {
  const year = await getActiveYear();
  const certs = await listCertificatesByYear(year);
  const entries: LedgerEntry[] = [];
  for (const cert of certs) {
    for (const e of cert.entries) {
      if (!e.allocatedYen && !e.totalYen) continue;
      entries.push({
        id: "",
        fiscalYear: year,
        date: e.date,
        category: cert.category,
        content: e.description || e.payee,
        payee: e.payee,
        incomeYen: 0,
        expenseYen: e.totalYen,
        allocationRatio: e.totalYen > 0 ? e.allocatedYen / e.totalYen : 1,
        allocatedYen: e.allocatedYen,
        note: cert.sourceKey ? `自動車使用簿生成: ${cert.sourceKey}` : "支払証明書",
        sourceKey: `payment:${cert.id}:${e.id}`,
      });
    }
  }
  const result = await appendLedgerEntries(year, entries);
  revalidatePath("/forms/ledger");
  revalidatePath("/forms/ledger/report");
  return result;
}

function dateOnly(s: string, fiscalYear: number): string {
  // 自由記述から日付を抽出。年なしの場合は会計年度から推定。
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const yearMonthDay = s.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (yearMonthDay) {
    const [, y, m, d] = yearMonthDay;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const monthDay = s.match(/(\d{1,2})月(\d{1,2})日/);
  if (monthDay) {
    const m = Number(monthDay[1]);
    const d = Number(monthDay[2]);
    // 4-12月→当該会計年度、1-3月→翌暦年
    const y = m >= 4 ? fiscalYear : fiscalYear + 1;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return "";
}
