"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createActivity,
  deleteActivity,
  listCertificatesByActivity,
  replaceActivitiesForYear,
  updateActivity,
  upsertCertificateBySource,
} from "@/lib/storage";
import { getActiveYear } from "@/lib/active-year";
import type {
  ActivityExpense,
  ActivityRecord,
  ExpenseCategory,
  PaymentEntry,
} from "@/lib/types";

function num(v: unknown): number {
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parseExpenses(form: FormData): ActivityExpense[] {
  const ids = form.getAll("expense_id").map(String);
  const addToCertSet = new Set(form.getAll("expense_addToCert").map(String));
  return ids.map((id, i) => ({
    id,
    category: String(form.getAll("expense_category")[i] ?? ""),
    description: String(form.getAll("expense_description")[i] ?? ""),
    totalYen: num(form.getAll("expense_total")[i]),
    allocatedYen: num(form.getAll("expense_allocated")[i]),
    note: String(form.getAll("expense_note")[i] ?? ""),
    payee: String(form.getAll("expense_payee")[i] ?? ""),
    addToCert: addToCertSet.has(id),
  }));
}

function parseHeader(form: FormData) {
  return {
    factionMemberName: String(form.get("factionMemberName") ?? ""),
    implementationDate: String(form.get("implementationDate") ?? ""),
    location: String(form.get("location") ?? ""),
    participants: String(form.get("participants") ?? ""),
    purposeContent: String(form.get("purposeContent") ?? ""),
    outOfPrefecture: form.get("outOfPrefecture") === "1",
  };
}

/** 活動記録の支出行 (addToCert=true) から、紐付き支払証明書をカテゴリ別に同期 */
async function syncCertsFromActivity(rec: ActivityRecord): Promise<void> {
  const ALLOWED: ExpenseCategory[] = [
    "調査研究費","研修費","広報広聴費","会議費","資料作成費",
    "資料購入費","要請陳情活動費","事務所費","事務費","人件費",
  ];
  const flag = (s: string): ExpenseCategory | null =>
    ALLOWED.includes(s as ExpenseCategory) ? (s as ExpenseCategory) : null;

  const dateOnly = (s: string): string => {
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const ymd = s.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (ymd) {
      return `${ymd[1]}-${String(ymd[2]).padStart(2, "0")}-${String(ymd[3]).padStart(2, "0")}`;
    }
    const md = s.match(/(\d{1,2})月(\d{1,2})日/);
    if (md) {
      const m = Number(md[1]);
      const d = Number(md[2]);
      const y = m >= 4 ? rec.fiscalYear : rec.fiscalYear + 1;
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    return "";
  };

  const date = dateOnly(rec.implementationDate);

  // カテゴリごとにグルーピング
  const byCat = new Map<ExpenseCategory, ActivityExpense[]>();
  for (const e of rec.expenses) {
    if (!e.addToCert) continue;
    const cat = flag(e.category);
    if (!cat) continue;
    if (!e.totalYen && !e.allocatedYen) continue;
    const arr = byCat.get(cat) ?? [];
    arr.push(e);
    byCat.set(cat, arr);
  }

  // 既存の紐付き cert 全て (チェックを外したカテゴリは entries=[] にする)
  const existing = await listCertificatesByActivity(rec.id);
  const existingCats = new Set(existing.map((c) => c.category));
  const allCats = new Set<ExpenseCategory>([...byCat.keys(), ...existingCats] as ExpenseCategory[]);

  for (const cat of allCats) {
    const sourceKey = `activity:${rec.id}:${cat}`;
    const exps = byCat.get(cat) ?? [];
    const entries: PaymentEntry[] = exps.map((e) => ({
      id: `${e.id}-cert`,
      date,
      totalYen: e.totalYen,
      payee: e.payee || "",
      description: e.description,
      allocatedYen: e.allocatedYen,
      note: e.note,
    }));
    await upsertCertificateBySource(sourceKey, {
      fiscalYear: rec.fiscalYear,
      category: cat,
      certifiedDate: "",
      signerName: "岩永 淳志",
      factionName: "みらいの会",
      representativeName: "岩永 淳志",
      entries,
      sourceKey,
      linkedActivityId: rec.id,
    });
  }
}

export async function createActivityAction(form: FormData) {
  const yearRaw = Number(form.get("fiscalYear"));
  const fiscalYear =
    Number.isFinite(yearRaw) && yearRaw > 0 ? yearRaw : await getActiveYear();
  const rec = await createActivity({
    ...parseHeader(form),
    fiscalYear,
    expenses: parseExpenses(form),
  });
  await syncCertsFromActivity(rec);
  revalidatePath("/");
  redirect(`/forms/activity-record/${rec.id}`);
}

export async function updateActivityAction(id: string, form: FormData) {
  const updated = await updateActivity(id, {
    ...parseHeader(form),
    expenses: parseExpenses(form),
  });
  if (updated) await syncCertsFromActivity(updated);
  revalidatePath("/");
  revalidatePath(`/forms/activity-record/${id}`);
}

export async function deleteActivityAction(id: string) {
  await deleteActivity(id);
  revalidatePath("/");
  redirect("/");
}

export async function saveAllActivitiesAction(form: FormData) {
  const payload = String(form.get("payload") ?? "[]");
  const yearRaw = Number(form.get("fiscalYear"));
  const year = Number.isFinite(yearRaw) && yearRaw > 0 ? yearRaw : await getActiveYear();
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    throw new Error("不正なペイロードです");
  }
  if (!Array.isArray(parsed)) throw new Error("配列である必要があります");
  const records: ActivityRecord[] = parsed.map((r: Record<string, unknown>) => ({
    id: String(r.id ?? ""),
    fiscalYear: year,
    factionMemberName: String(r.factionMemberName ?? ""),
    implementationDate: String(r.implementationDate ?? ""),
    location: String(r.location ?? ""),
    participants: String(r.participants ?? ""),
    purposeContent: String(r.purposeContent ?? ""),
    outOfPrefecture: !!r.outOfPrefecture,
    linkedReceiptIds: Array.isArray(r.linkedReceiptIds)
      ? (r.linkedReceiptIds as unknown[]).map(String)
      : [],
    expenses: Array.isArray(r.expenses)
      ? (r.expenses as Record<string, unknown>[]).map((e) => ({
          id: String(e.id ?? ""),
          category: String(e.category ?? ""),
          description: String(e.description ?? ""),
          totalYen: num(e.totalYen),
          allocatedYen: num(e.allocatedYen),
          note: String(e.note ?? ""),
        }))
      : [],
    createdAt: String(r.createdAt ?? ""),
    updatedAt: String(r.updatedAt ?? ""),
  }));
  await replaceActivitiesForYear(year, records);
  revalidatePath("/");
  revalidatePath("/forms/activity-record");
}
