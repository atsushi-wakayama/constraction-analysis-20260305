import * as XLSX from "xlsx";
import { randomUUID } from "node:crypto";
import type {
  ExpenseCategory,
  LedgerEntry,
  VehicleTrip,
} from "./types";

const ALLOWED: ExpenseCategory[] = [
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

function normCategory(s: unknown): ExpenseCategory | "" {
  if (!s) return "";
  let str = String(s).trim().replace(/[\s　]/g, "");
  if (!str) return "";
  if (str.includes("陳情")) return "要請陳情活動費";
  if (str.includes("広聴") || str.includes("広報")) return "広報広聴費";
  if (str.includes("事務所")) return "事務所費";
  if (str === "事務費" || str === "事 務 費") return "事務費";
  if ((ALLOWED as string[]).includes(str)) return str as ExpenseCategory;
  for (const c of ALLOWED) {
    if (str.includes(c) || c.includes(str)) return c;
  }
  return "";
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (v === null || v === undefined || v === "") return 0;
  const s = String(v).replace(/[^\d.-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function isExcelDate(v: unknown): v is number {
  return typeof v === "number" && v > 1 && v < 100000;
}

function excelDateToISO(serial: number): string {
  // Excel serial: days since 1900-01-01 (with leap year bug)
  const date = XLSX.SSF.parse_date_code(serial);
  if (!date) return "";
  return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
}

function dateValueToISO(v: unknown): string {
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (isExcelDate(v)) return excelDateToISO(v);
  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
    const m = v.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    if (m) return `${m[1]}-${String(m[2]).padStart(2, "0")}-${String(m[3]).padStart(2, "0")}`;
  }
  return "";
}

export interface XlsxDetection {
  type: "ledger" | "vehicle-log" | "unknown";
  sheets: string[];
}

export function detectXlsx(buffer: Buffer): XlsxDetection {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheets = wb.SheetNames;
  if (sheets.includes("個人会計帳簿") || sheets.includes("個人会計帳簿（修正）")) {
    return { type: "ledger", sheets };
  }
  // 月ごとシート (7月, 8月, ...) があれば自動車使用簿
  const monthSheets = sheets.filter((s) => /^[1-9]月$|^1[0-2]月$/.test(s));
  if (monthSheets.length >= 3) {
    return { type: "vehicle-log", sheets: monthSheets };
  }
  return { type: "unknown", sheets };
}

export function parseLedgerXlsx(buffer: Buffer, fiscalYear: number): LedgerEntry[] {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true, raw: true });
  const sheetName = wb.SheetNames.includes("個人会計帳簿")
    ? "個人会計帳簿"
    : wb.SheetNames.find((s) => s.includes("会計帳簿"));
  if (!sheetName) return [];
  const ws = wb.Sheets[sheetName];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: false,
    defval: "",
  });

  // 列マッピング: 列1=年, 列2=月日, 列3=種別, 列4=内容, 列5=収入, 列6=支出, 列7=支払先, 列8=按分率, 列9=充当額, 列10=備考
  const entries: LedgerEntry[] = [];
  for (const r of rows) {
    if (!Array.isArray(r) || r.length < 10) continue;
    const date = dateValueToISO(r[2]);
    if (!date) continue;
    const income = num(r[5]);
    const expense = num(r[6]);
    if (!income && !expense) continue;
    entries.push({
      id: randomUUID(),
      fiscalYear,
      date,
      category: normCategory(r[3]),
      content: String(r[4] ?? "").trim(),
      payee: String(r[7] ?? "").trim(),
      incomeYen: Math.round(income),
      expenseYen: Math.round(expense),
      allocationRatio: num(r[8]) || 1,
      allocatedYen: Math.round(num(r[9])),
      note: String(r[10] ?? "").trim(),
    });
  }
  return entries;
}

const JP_MONTH: Record<string, number> = {
  "1月": 1, "2月": 2, "3月": 3, "4月": 4, "5月": 5, "6月": 6,
  "7月": 7, "8月": 8, "9月": 9, "10月": 10, "11月": 11, "12月": 12,
};

export function parseVehicleLogXlsx(buffer: Buffer, fiscalYear: number): VehicleTrip[] {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true, raw: true });
  const trips: VehicleTrip[] = [];
  for (const sn of wb.SheetNames) {
    const month = JP_MONTH[sn];
    if (!month) continue;
    const ws = wb.Sheets[sn];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      raw: true,
      defval: "",
    });
    // 各シート 7行目以降が日次データ。col0 or col4 が日付、col6 = 目的、col9 = 総km、col10 = 政務活動km、col12 = 経費種別、col13 = 備考
    for (const r of rows) {
      if (!Array.isArray(r)) continue;
      const dateRaw = r[0] ?? r[4];
      const date = dateValueToISO(dateRaw);
      if (!date) continue;
      const purpose = String(r[6] ?? "").trim();
      const totalKm = num(r[9]);
      const businessKm = num(r[10]);
      const cat = normCategory(r[12]) || "調査研究費";
      const note = String(r[13] ?? "").trim();
      if (!purpose && totalKm === 0 && businessKm === 0) continue;
      trips.push({
        id: randomUUID(),
        fiscalYear,
        month,
        date,
        purpose,
        totalKm,
        businessKm,
        category: cat as ExpenseCategory,
        note,
      });
    }
  }
  return trips;
}
