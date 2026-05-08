"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createReceipt,
  deleteReceipt,
  updateReceipt,
} from "@/lib/storage";
import { getActiveYear } from "@/lib/active-year";
import { pdfToJpegPages, saveImageBuffer } from "@/lib/pdf-convert";
import type { ExpenseCategory } from "@/lib/types";

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

function pickCategory(form: FormData): ExpenseCategory {
  const cat = String(form.get("category") ?? "");
  return CATEGORIES.includes(cat as ExpenseCategory)
    ? (cat as ExpenseCategory)
    : "調査研究費";
}

export async function uploadReceiptAction(form: FormData) {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("ファイルを選択してください");
  }
  const category = pickCategory(form);
  const date = String(form.get("date") ?? "");
  const payee = String(form.get("payee") ?? "");
  const totalYen = num(form.get("totalYen"));
  const allocatedYen = num(form.get("allocatedYen") ?? form.get("totalYen"));
  const description = String(form.get("description") ?? "");
  const note = String(form.get("note") ?? "");
  const linkedActivityId = String(form.get("linkedActivityId") ?? "") || undefined;
  const fiscalYear = await getActiveYear();
  const buf = Buffer.from(await file.arrayBuffer());
  const baseName = file.name;
  const lower = baseName.toLowerCase();
  const isPdf = file.type === "application/pdf" || lower.endsWith(".pdf");
  const isJpeg = /\.jpe?g$/i.test(lower) || file.type === "image/jpeg";
  const isPng = lower.endsWith(".png") || file.type === "image/png";

  let createdIds: string[] = [];

  if (isPdf) {
    const pages = await pdfToJpegPages(buf);
    if (pages.length === 0) throw new Error("PDFのページ化に失敗しました");
    for (let i = 0; i < pages.length; i++) {
      const r = await createReceipt({
        fiscalYear,
        category,
        date: pages.length === 1 ? date : "", // 複数ページ時は個別入力
        payee: pages.length === 1 ? payee : "",
        totalYen: pages.length === 1 ? totalYen : 0,
        allocatedYen: pages.length === 1 ? allocatedYen : 0,
        description: pages.length === 1 ? description : "",
        note: pages.length === 1 ? note : "",
        imageFile: pages[i],
        sourcePdf: baseName,
        pageNumber: i + 1,
        mimeType: "image/jpeg",
        linkedActivityId,
      });
      createdIds.push(r.id);
    }
  } else if (isJpeg || isPng) {
    const filename = await saveImageBuffer(buf, isPng ? "png" : "jpg");
    const r = await createReceipt({
      fiscalYear,
      category,
      date,
      payee,
      totalYen,
      allocatedYen,
      description,
      note,
      imageFile: filename,
      mimeType: isPng ? "image/png" : "image/jpeg",
      linkedActivityId,
    });
    createdIds.push(r.id);
  } else {
    throw new Error(`対応していない形式です: ${file.type || baseName}`);
  }

  revalidatePath("/");
  revalidatePath("/forms/receipt");
  if (linkedActivityId) {
    revalidatePath(`/forms/activity-record/${linkedActivityId}`);
    redirect(`/forms/activity-record/${linkedActivityId}`);
  }
  if (createdIds.length === 1) {
    redirect(`/forms/receipt/${createdIds[0]}`);
  } else {
    redirect("/forms/receipt");
  }
}

export async function updateReceiptAction(id: string, form: FormData) {
  await updateReceipt(id, {
    category: pickCategory(form),
    date: String(form.get("date") ?? ""),
    payee: String(form.get("payee") ?? ""),
    totalYen: num(form.get("totalYen")),
    allocatedYen: num(form.get("allocatedYen")),
    description: String(form.get("description") ?? ""),
    note: String(form.get("note") ?? ""),
  });
  revalidatePath("/");
  revalidatePath("/forms/receipt");
  revalidatePath(`/forms/receipt/${id}`);
}

export async function deleteReceiptAction(id: string) {
  await deleteReceipt(id);
  revalidatePath("/");
  revalidatePath("/forms/receipt");
  redirect("/forms/receipt");
}
