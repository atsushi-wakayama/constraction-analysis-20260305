"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCertificate,
  deleteCertificate,
  updateCertificate,
} from "@/lib/storage";
import { getActiveYear } from "@/lib/active-year";
import type { ExpenseCategory, PaymentEntry } from "@/lib/types";

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

function num(v: FormDataEntryValue | null): number {
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parseEntries(form: FormData): PaymentEntry[] {
  const ids = form.getAll("entry_id").map(String);
  return ids.map((id, i) => ({
    id,
    date: String(form.getAll("entry_date")[i] ?? ""),
    totalYen: num(form.getAll("entry_total")[i]),
    payee: String(form.getAll("entry_payee")[i] ?? ""),
    description: String(form.getAll("entry_description")[i] ?? ""),
    allocatedYen: num(form.getAll("entry_allocated")[i]),
    note: String(form.getAll("entry_note")[i] ?? ""),
  }));
}

function parseHeader(form: FormData) {
  const cat = String(form.get("category") ?? "調査研究費");
  const category = (CATEGORIES.includes(cat as ExpenseCategory)
    ? cat
    : "調査研究費") as ExpenseCategory;
  const linkedActivityId = String(form.get("linkedActivityId") ?? "");
  return {
    category,
    certifiedDate: String(form.get("certifiedDate") ?? ""),
    signerName: String(form.get("signerName") ?? ""),
    factionName: String(form.get("factionName") ?? ""),
    representativeName: String(form.get("representativeName") ?? ""),
    ...(linkedActivityId ? { linkedActivityId } : {}),
  };
}

export async function createCertificateAction(form: FormData) {
  const cert = await createCertificate({
    ...parseHeader(form),
    fiscalYear: await getActiveYear(),
    entries: parseEntries(form),
  });
  revalidatePath("/");
  redirect(`/forms/payment-certificate/${cert.id}`);
}

export async function updateCertificateAction(id: string, form: FormData) {
  await updateCertificate(id, {
    ...parseHeader(form),
    entries: parseEntries(form),
  });
  revalidatePath("/");
  revalidatePath(`/forms/payment-certificate/${id}`);
}

export async function deleteCertificateAction(id: string) {
  await deleteCertificate(id);
  revalidatePath("/");
  redirect("/");
}
