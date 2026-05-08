import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  ActivityExpense,
  ActivityRecord,
  LedgerEntry,
  PaymentCertificate,
  PaymentEntry,
  Receipt,
  VehicleTrip,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "payments.json");
const ACTIVITY_FILE = path.join(DATA_DIR, "activities.json");
const RECEIPT_FILE = path.join(DATA_DIR, "receipts.json");
const VEHICLE_FILE = path.join(DATA_DIR, "vehicle-trips.json");
const LEDGER_FILE = path.join(DATA_DIR, "ledger.json");
export const RECEIPT_IMAGE_DIR = path.join(DATA_DIR, "receipt-images");

async function readAll(): Promise<PaymentCertificate[]> {
  try {
    const buf = await fs.readFile(FILE, "utf8");
    return JSON.parse(buf) as PaymentCertificate[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function writeAll(list: PaymentCertificate[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}

export async function listCertificates(): Promise<PaymentCertificate[]> {
  const list = await readAll();
  return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listCertificateFiscalYears(): Promise<number[]> {
  const list = await readAll();
  const years = new Set<number>();
  for (const c of list) years.add(c.fiscalYear ?? currentFiscalYear());
  return [...years].sort((a, b) => b - a);
}

export async function listCertificatesByYear(year: number): Promise<PaymentCertificate[]> {
  const list = await readAll();
  return list
    .filter((c) => (c.fiscalYear ?? currentFiscalYear()) === year)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listCertificatesByActivity(
  activityId: string,
): Promise<PaymentCertificate[]> {
  const list = await readAll();
  return list.filter((c) => c.linkedActivityId === activityId);
}

export async function listReceiptsByActivity(activityId: string): Promise<Receipt[]> {
  const list = await readReceipts();
  return list.filter((r) => r.linkedActivityId === activityId);
}

export async function getCertificate(id: string): Promise<PaymentCertificate | null> {
  const list = await readAll();
  return list.find((c) => c.id === id) ?? null;
}

export async function createCertificate(
  partial: Omit<PaymentCertificate, "id" | "createdAt" | "updatedAt" | "entries" | "fiscalYear"> & {
    entries?: PaymentEntry[];
    fiscalYear?: number;
  },
): Promise<PaymentCertificate> {
  const now = new Date().toISOString();
  const cert: PaymentCertificate = {
    id: randomUUID(),
    fiscalYear: partial.fiscalYear ?? currentFiscalYear(),
    createdAt: now,
    updatedAt: now,
    entries: partial.entries ?? [],
    ...partial,
  };
  const list = await readAll();
  list.push(cert);
  await writeAll(list);
  return cert;
}

export async function updateCertificate(
  id: string,
  patch: Partial<Omit<PaymentCertificate, "id" | "createdAt">>,
): Promise<PaymentCertificate | null> {
  const list = await readAll();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const updated = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  list[idx] = updated;
  await writeAll(list);
  return updated;
}

export async function deleteCertificate(id: string): Promise<boolean> {
  const list = await readAll();
  const next = list.filter((c) => c.id !== id);
  if (next.length === list.length) return false;
  await writeAll(next);
  return true;
}

export function newEntry(): PaymentEntry {
  return {
    id: randomUUID(),
    date: "",
    totalYen: 0,
    payee: "",
    description: "",
    allocatedYen: 0,
    note: "",
  };
}

async function readActivities(): Promise<ActivityRecord[]> {
  try {
    const buf = await fs.readFile(ACTIVITY_FILE, "utf8");
    return JSON.parse(buf) as ActivityRecord[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function writeActivities(list: ActivityRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${ACTIVITY_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), "utf8");
  await fs.rename(tmp, ACTIVITY_FILE);
}

export function currentFiscalYear(now = new Date()): number {
  // 日本の会計年度: 4/1〜翌3/31
  return now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
}

export async function listActivities(): Promise<ActivityRecord[]> {
  const list = await readActivities();
  return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listActivityFiscalYears(): Promise<number[]> {
  const list = await readActivities();
  const years = new Set<number>();
  for (const r of list) years.add(r.fiscalYear ?? currentFiscalYear());
  if (years.size === 0) years.add(currentFiscalYear());
  return [...years].sort((a, b) => b - a);
}

export async function listActivitiesByYear(year: number): Promise<ActivityRecord[]> {
  const list = await readActivities();
  return list
    .filter((r) => (r.fiscalYear ?? currentFiscalYear()) === year)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function listOutOfPrefectureByYear(year: number): Promise<ActivityRecord[]> {
  const list = await listActivitiesByYear(year);
  return list.filter((r) => r.outOfPrefecture === true);
}

export async function getActivity(id: string): Promise<ActivityRecord | null> {
  const list = await readActivities();
  return list.find((c) => c.id === id) ?? null;
}

export async function createActivity(
  partial: Omit<ActivityRecord, "id" | "createdAt" | "updatedAt" | "expenses" | "fiscalYear"> & {
    expenses?: ActivityExpense[];
    fiscalYear?: number;
  },
): Promise<ActivityRecord> {
  const now = new Date().toISOString();
  const rec: ActivityRecord = {
    id: randomUUID(),
    fiscalYear: partial.fiscalYear ?? currentFiscalYear(),
    createdAt: now,
    updatedAt: now,
    expenses: partial.expenses ?? [],
    ...partial,
  };
  const list = await readActivities();
  list.push(rec);
  await writeActivities(list);
  return rec;
}

export async function updateActivity(
  id: string,
  patch: Partial<Omit<ActivityRecord, "id" | "createdAt">>,
): Promise<ActivityRecord | null> {
  const list = await readActivities();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const updated = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  list[idx] = updated;
  await writeActivities(list);
  return updated;
}

export async function deleteActivity(id: string): Promise<boolean> {
  const list = await readActivities();
  const next = list.filter((c) => c.id !== id);
  if (next.length === list.length) return false;
  await writeActivities(next);
  return true;
}

async function readLedger(): Promise<LedgerEntry[]> {
  try {
    const buf = await fs.readFile(LEDGER_FILE, "utf8");
    return JSON.parse(buf) as LedgerEntry[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function writeLedger(list: LedgerEntry[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${LEDGER_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), "utf8");
  await fs.rename(tmp, LEDGER_FILE);
}

export async function listLedgerByYear(year: number): Promise<LedgerEntry[]> {
  const list = await readLedger();
  return list
    .filter((e) => (e.fiscalYear ?? currentFiscalYear()) === year)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}

export async function replaceLedgerForYear(
  year: number,
  entries: LedgerEntry[],
): Promise<void> {
  const list = await readLedger();
  const others = list.filter(
    (e) => (e.fiscalYear ?? currentFiscalYear()) !== year,
  );
  const updated = entries.map((e) => ({
    ...e,
    id: e.id || randomUUID(),
    fiscalYear: year,
  }));
  await writeLedger([...others, ...updated]);
}

export async function appendLedgerEntries(
  year: number,
  entries: LedgerEntry[],
): Promise<{ added: number; skipped: number }> {
  const list = await readLedger();
  const existingKeys = new Set(
    list
      .filter((e) => (e.fiscalYear ?? currentFiscalYear()) === year && e.sourceKey)
      .map((e) => e.sourceKey),
  );
  let added = 0;
  let skipped = 0;
  for (const e of entries) {
    if (e.sourceKey && existingKeys.has(e.sourceKey)) {
      skipped += 1;
      continue;
    }
    list.push({
      ...e,
      id: e.id || randomUUID(),
      fiscalYear: year,
    });
    if (e.sourceKey) existingKeys.add(e.sourceKey);
    added += 1;
  }
  await writeLedger(list);
  return { added, skipped };
}

async function readVehicleTrips(): Promise<VehicleTrip[]> {
  try {
    const buf = await fs.readFile(VEHICLE_FILE, "utf8");
    return JSON.parse(buf) as VehicleTrip[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function writeVehicleTrips(list: VehicleTrip[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${VEHICLE_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), "utf8");
  await fs.rename(tmp, VEHICLE_FILE);
}

export async function listVehicleTripsByYear(year: number): Promise<VehicleTrip[]> {
  const list = await readVehicleTrips();
  return list
    .filter((t) => (t.fiscalYear ?? currentFiscalYear()) === year)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}

export async function listVehicleTripsByYearMonth(
  year: number,
  month: number,
): Promise<VehicleTrip[]> {
  const list = await readVehicleTrips();
  return list
    .filter(
      (t) =>
        (t.fiscalYear ?? currentFiscalYear()) === year && t.month === month,
    )
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}

export async function replaceVehicleTripsForYearMonth(
  year: number,
  month: number,
  trips: VehicleTrip[],
): Promise<void> {
  const list = await readVehicleTrips();
  const others = list.filter(
    (t) => !((t.fiscalYear ?? currentFiscalYear()) === year && t.month === month),
  );
  const updated = trips.map((t) => ({
    ...t,
    id: t.id || randomUUID(),
    fiscalYear: year,
    month,
  }));
  await writeVehicleTrips([...others, ...updated]);
}

export async function upsertCertificateBySource(
  sourceKey: string,
  draft: Omit<PaymentCertificate, "id" | "createdAt" | "updatedAt"> & {
    fiscalYear: number;
  },
): Promise<PaymentCertificate> {
  const list = await readAll();
  const idx = list.findIndex((c) => c.sourceKey === sourceKey);
  const now = new Date().toISOString();
  if (idx === -1) {
    const cert: PaymentCertificate = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...draft,
      sourceKey,
    };
    list.push(cert);
    await writeAll(list);
    return cert;
  }
  const existing = list[idx];
  const updated: PaymentCertificate = {
    ...existing,
    ...draft,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: now,
    sourceKey,
  };
  list[idx] = updated;
  await writeAll(list);
  return updated;
}

async function readReceipts(): Promise<Receipt[]> {
  try {
    const buf = await fs.readFile(RECEIPT_FILE, "utf8");
    return JSON.parse(buf) as Receipt[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function writeReceipts(list: Receipt[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${RECEIPT_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), "utf8");
  await fs.rename(tmp, RECEIPT_FILE);
}

export async function listReceiptsByYear(year: number): Promise<Receipt[]> {
  const list = await readReceipts();
  return list
    .filter((r) => (r.fiscalYear ?? currentFiscalYear()) === year)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}

export async function listReceiptsByYearAndCategory(
  year: number,
  category: string,
): Promise<Receipt[]> {
  const list = await readReceipts();
  return list
    .filter(
      (r) => (r.fiscalYear ?? currentFiscalYear()) === year && r.category === category,
    )
    .sort((a, b) => {
      const ad = a.date || "";
      const bd = b.date || "";
      if (ad !== bd) return ad.localeCompare(bd);
      const ap = a.pageNumber ?? 0;
      const bp = b.pageNumber ?? 0;
      return ap - bp;
    });
}

export async function listReceiptFiscalYears(): Promise<number[]> {
  const list = await readReceipts();
  const years = new Set<number>();
  for (const r of list) years.add(r.fiscalYear ?? currentFiscalYear());
  return [...years].sort((a, b) => b - a);
}

export async function getReceipt(id: string): Promise<Receipt | null> {
  const list = await readReceipts();
  return list.find((r) => r.id === id) ?? null;
}

export async function createReceipt(
  partial: Omit<Receipt, "id" | "createdAt" | "updatedAt">,
): Promise<Receipt> {
  const now = new Date().toISOString();
  const r: Receipt = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
  const list = await readReceipts();
  list.push(r);
  await writeReceipts(list);
  return r;
}

export async function updateReceipt(
  id: string,
  patch: Partial<Omit<Receipt, "id" | "createdAt">>,
): Promise<Receipt | null> {
  const list = await readReceipts();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const updated = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  list[idx] = updated;
  await writeReceipts(list);
  return updated;
}

export async function deleteReceipt(id: string): Promise<boolean> {
  const list = await readReceipts();
  const target = list.find((r) => r.id === id);
  if (!target) return false;
  const next = list.filter((r) => r.id !== id);
  await writeReceipts(next);
  if (target.imageFile) {
    try {
      await fs.unlink(path.join(RECEIPT_IMAGE_DIR, target.imageFile));
    } catch {
      /* ignore missing file */
    }
  }
  return true;
}

export async function replaceActivitiesForYear(
  year: number,
  records: ActivityRecord[],
): Promise<void> {
  const now = new Date().toISOString();
  const existing = await readActivities();
  const byId = new Map(existing.map((r) => [r.id, r]));
  const others = existing.filter((r) => (r.fiscalYear ?? currentFiscalYear()) !== year);
  const updated = records.map((r) => ({
    ...r,
    id: r.id || randomUUID(),
    fiscalYear: year,
    createdAt: byId.get(r.id)?.createdAt ?? now,
    updatedAt: now,
    expenses: r.expenses.map((e) => ({ ...e, id: e.id || randomUUID() })),
  }));
  await writeActivities([...others, ...updated]);
}
