"use server";

import { revalidatePath } from "next/cache";
import {
  appendLedgerEntries,
  createActivity,
  createCertificate,
  replaceVehicleTripsForYearMonth,
} from "@/lib/storage";
import { getActiveYear } from "@/lib/active-year";
import {
  detectXlsx,
  parseLedgerXlsx,
  parseVehicleLogXlsx,
} from "@/lib/import-xlsx";
import {
  detectDocx,
  parseActivityRecordDocx,
  parsePaymentCertDocx,
} from "@/lib/import-docx";

export interface ImportResult {
  filename: string;
  ok: boolean;
  type: string;
  message: string;
  details?: unknown;
}

export async function importFilesAction(form: FormData): Promise<ImportResult[]> {
  const files = form.getAll("files");
  const fiscalYear = await getActiveYear();
  const results: ImportResult[] = [];

  for (const f of files) {
    if (!(f instanceof File) || f.size === 0) continue;
    const buf = Buffer.from(await f.arrayBuffer());
    const lower = f.name.toLowerCase();
    try {
      if (lower.endsWith(".xlsx")) {
        const det = detectXlsx(buf);
        if (det.type === "ledger") {
          const entries = parseLedgerXlsx(buf, fiscalYear);
          const r = await appendLedgerEntries(fiscalYear, entries);
          results.push({
            filename: f.name,
            ok: true,
            type: "個人会計帳簿(xlsx)",
            message: `${entries.length}行検出、追加 ${r.added}件 / スキップ ${r.skipped}件（重複）`,
          });
        } else if (det.type === "vehicle-log") {
          const trips = parseVehicleLogXlsx(buf, fiscalYear);
          // 月ごとに分けて置換
          const byMonth = new Map<number, typeof trips>();
          for (const t of trips) {
            const arr = byMonth.get(t.month) ?? [];
            arr.push(t);
            byMonth.set(t.month, arr);
          }
          for (const [m, list] of byMonth) {
            await replaceVehicleTripsForYearMonth(fiscalYear, m, list);
          }
          results.push({
            filename: f.name,
            ok: true,
            type: "自家用自動車使用簿(xlsx)",
            message: `${trips.length}件のtripを${byMonth.size}ヶ月分にインポート（既存月は置換）`,
          });
        } else {
          results.push({
            filename: f.name,
            ok: false,
            type: "xlsx",
            message: `形式が判定できません（シート名: ${det.sheets.join(", ")}）`,
          });
        }
      } else if (lower.endsWith(".docx")) {
        const det = await detectDocx(buf);
        if (det.type === "payment-cert") {
          const cert = await parsePaymentCertDocx(buf, fiscalYear, f.name);
          if (!cert) {
            results.push({
              filename: f.name,
              ok: false,
              type: "支払証明書(docx)",
              message: "明細を抽出できませんでした",
            });
            continue;
          }
          const created = await createCertificate(cert);
          results.push({
            filename: f.name,
            ok: true,
            type: "支払証明書(docx)",
            message: `${created.category}・${created.entries.length}件・充当合計¥${created.entries
              .reduce((s, e) => s + e.allocatedYen, 0)
              .toLocaleString()}を登録`,
          });
        } else if (det.type === "activity-record") {
          const records = await parseActivityRecordDocx(buf, fiscalYear);
          let added = 0;
          for (const r of records) {
            await createActivity({
              fiscalYear: r.fiscalYear,
              factionMemberName: r.factionMemberName,
              implementationDate: r.implementationDate,
              location: r.location,
              participants: r.participants,
              purposeContent: r.purposeContent,
              expenses: r.expenses,
              outOfPrefecture: r.outOfPrefecture,
            });
            added++;
          }
          results.push({
            filename: f.name,
            ok: true,
            type: "活動記録簿(docx)",
            message: `${added}件の活動記録を登録`,
          });
        } else {
          results.push({
            filename: f.name,
            ok: false,
            type: "docx",
            message: "形式が判定できません",
          });
        }
      } else {
        results.push({
          filename: f.name,
          ok: false,
          type: "unknown",
          message: ".xlsx または .docx のみ対応",
        });
      }
    } catch (err) {
      results.push({
        filename: f.name,
        ok: false,
        type: "error",
        message: String(err),
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/forms/ledger");
  revalidatePath("/forms/payment-certificate/new");
  revalidatePath("/forms/activity-record");
  revalidatePath("/forms/vehicle-log");
  return results;
}
