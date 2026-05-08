"use server";

import { revalidatePath } from "next/cache";
import {
  listVehicleTripsByYear,
  listVehicleTripsByYearMonth,
  replaceVehicleTripsForYearMonth,
  upsertCertificateBySource,
} from "@/lib/storage";
import { getActiveYear } from "@/lib/active-year";
import type { ExpenseCategory, PaymentEntry, VehicleTrip } from "@/lib/types";

const KM_TO_YEN = 20;

function num(v: unknown): number {
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function categoryOk(s: string): ExpenseCategory {
  const allowed: ExpenseCategory[] = [
    "調査研究費",
    "研修費",
    "広報広聴費",
    "会議費",
    "資料作成費",
    "資料購入費",
    "要請陳情活動費",
    "事務所費",
    "人件費",
  ];
  return allowed.includes(s as ExpenseCategory) ? (s as ExpenseCategory) : "調査研究費";
}

export async function saveVehicleTripsAction(form: FormData) {
  const month = Number(form.get("month"));
  const yearForm = Number(form.get("fiscalYear"));
  const year =
    Number.isFinite(yearForm) && yearForm > 0 ? yearForm : await getActiveYear();
  if (!Number.isFinite(month) || month < 1 || month > 12) {
    throw new Error("月が不正です");
  }
  const payload = String(form.get("payload") ?? "[]");
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    throw new Error("ペイロードが不正です");
  }
  if (!Array.isArray(parsed)) throw new Error("配列である必要があります");
  const trips: VehicleTrip[] = parsed.map((r: Record<string, unknown>) => ({
    id: String(r.id ?? ""),
    fiscalYear: year,
    month,
    date: String(r.date ?? ""),
    purpose: String(r.purpose ?? ""),
    totalKm: num(r.totalKm),
    businessKm: num(r.businessKm),
    category: categoryOk(String(r.category ?? "調査研究費")),
    note: String(r.note ?? ""),
  }));
  await replaceVehicleTripsForYearMonth(year, month, trips);
  revalidatePath("/forms/vehicle-log");
  revalidatePath(`/forms/vehicle-log/${month}`);
  revalidatePath("/");
}

/**
 * 当該年度の全trip を経費種別ごとにまとめ、支払証明書を1ファイルに統合（既存があれば置換）。
 * sourceKey = "vehicle:YYYY:CATEGORY"
 */
export async function regeneratePaymentCertsAction(form: FormData) {
  const yearForm = Number(form.get("fiscalYear"));
  const year =
    Number.isFinite(yearForm) && yearForm > 0 ? yearForm : await getActiveYear();

  const trips = (await listVehicleTripsByYear(year)).filter((t) => t.businessKm > 0);
  const byCategory = new Map<ExpenseCategory, VehicleTrip[]>();
  for (const t of trips) {
    const arr = byCategory.get(t.category) ?? [];
    arr.push(t);
    byCategory.set(t.category, arr);
  }

  const summary: { category: string; count: number; sumYen: number }[] = [];

  for (const [category, list] of byCategory) {
    const entries: PaymentEntry[] = list
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) => {
        const yen = Math.round(t.businessKm * KM_TO_YEN);
        const purposeText = t.purpose ? `\n${t.purpose}` : "";
        return {
          id: `${t.id}-entry`,
          date: t.date,
          totalYen: yen,
          payee: "ガソリン代",
          description: `${t.businessKm}km× 20円${purposeText}`,
          allocatedYen: yen,
          note: t.note,
        };
      });
    const totalYen = entries.reduce((s, e) => s + e.allocatedYen, 0);
    const sourceKey = `vehicle:${year}:${category}`;
    await upsertCertificateBySource(sourceKey, {
      fiscalYear: year,
      category,
      certifiedDate: "",
      signerName: "岩永 淳志",
      factionName: "みらいの会",
      representativeName: "岩永 淳志",
      entries,
      sourceKey,
    });
    summary.push({ category, count: entries.length, sumYen: totalYen });
  }

  revalidatePath("/");
  revalidatePath("/forms/vehicle-log");
  return summary;
}
