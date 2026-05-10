import JSZip from "jszip";
import { randomUUID } from "node:crypto";
import type {
  ActivityExpense,
  ActivityRecord,
  ExpenseCategory,
  PaymentCertificate,
  PaymentEntry,
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

function normCategory(s: string): ExpenseCategory {
  if (!s) return "調査研究費";
  const str = s.trim().replace(/[\s　]/g, "");
  if (str.includes("陳情")) return "要請陳情活動費";
  if (str.includes("広聴") || str.includes("広報")) return "広報広聴費";
  if (str.includes("事務所")) return "事務所費";
  if (str === "事務費" || str.includes("事務費")) return "事務費";
  for (const c of ALLOWED) {
    if (str.includes(c) || c.includes(str)) return c;
  }
  return "調査研究費";
}

function num(s: string): number {
  const n = Number(s.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** docx を unzip → word/document.xml の中身（生XML文字列）を取得 */
async function readDocumentXml(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const file = zip.file("word/document.xml");
  if (!file) throw new Error("word/document.xml が見つかりません");
  return await file.async("string");
}

/** XML から table (w:tbl) を抽出。table → rows (w:tr) → cells (w:tc) → text */
function parseTables(xml: string): string[][][] {
  const tables: string[][][] = [];
  const tblRe = /<w:tbl(?:\s[^>]*)?>([\s\S]*?)<\/w:tbl>/g;
  let m: RegExpExecArray | null;
  while ((m = tblRe.exec(xml)) !== null) {
    const tableXml = m[1];
    const rows: string[][] = [];
    const trRe = /<w:tr(?:\s[^>]*)?>([\s\S]*?)<\/w:tr>/g;
    let tm: RegExpExecArray | null;
    while ((tm = trRe.exec(tableXml)) !== null) {
      const rowXml = tm[1];
      const cells: string[] = [];
      const tcRe = /<w:tc(?:\s[^>]*)?>([\s\S]*?)<\/w:tc>/g;
      let cm: RegExpExecArray | null;
      while ((cm = tcRe.exec(rowXml)) !== null) {
        const cellXml = cm[1];
        // 段落ごとにテキストを抽出して改行で結合
        const paraTexts: string[] = [];
        const pRe = /<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g;
        let pm: RegExpExecArray | null;
        while ((pm = pRe.exec(cellXml)) !== null) {
          const pXml = pm[1];
          const tRe = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
          const parts: string[] = [];
          let tm2: RegExpExecArray | null;
          while ((tm2 = tRe.exec(pXml)) !== null) {
            parts.push(tm2[1]);
          }
          paraTexts.push(parts.join(""));
        }
        cells.push(paraTexts.join("\n").trim());
      }
      if (cells.length) rows.push(cells);
    }
    if (rows.length) tables.push(rows);
  }
  return tables;
}

function tryParseDate(s: string, fiscalYear: number): string {
  const m1 = s.match(/(\d{4})\D*年\D*(\d{1,2})\D*月\D*(\d{1,2})\D*日/);
  if (m1) {
    return `${m1[1]}-${String(m1[2]).padStart(2, "0")}-${String(m1[3]).padStart(2, "0")}`;
  }
  const m2 = s.match(/(\d{1,2})\D*月\D*(\d{1,2})\D*日/);
  if (m2) {
    const m = Number(m2[1]);
    const d = Number(m2[2]);
    const y = m >= 4 ? fiscalYear : fiscalYear + 1;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return "";
}

export interface DocxDetection {
  type: "payment-cert" | "activity-record" | "unknown";
}

export async function detectDocx(buffer: Buffer): Promise<DocxDetection> {
  const xml = await readDocumentXml(buffer);
  if (xml.includes("活 動 記 録 簿") || xml.includes("活動記録簿")) {
    return { type: "activity-record" };
  }
  if (xml.includes("支払証明書") || xml.includes("別記第7号様式")) {
    return { type: "payment-cert" };
  }
  return { type: "unknown" };
}

/**
 * 支払証明書 docx を解析して PaymentCertificate を返す（カテゴリは経費種別欄から推定、文書全体を1ファイルとして扱う）
 * 経費種別欄に複数カテゴリ名が並ぶ docx でも、明細行の充当額の合計から最も矛盾の少ないカテゴリを採用
 */
export async function parsePaymentCertDocx(
  buffer: Buffer,
  fiscalYear: number,
  fileBaseName: string,
): Promise<PaymentCertificate | null> {
  const xml = await readDocumentXml(buffer);
  const tables = parseTables(xml);
  if (tables.length === 0) return null;

  // ファイル名からカテゴリ推定
  const baseLower = fileBaseName.replace(/\.docx$/i, "");
  let inferredCat: ExpenseCategory = normCategory(baseLower);

  const entries: PaymentEntry[] = [];
  for (const table of tables) {
    // ヘッダ行を見つける: 含む = "支払年月日", "政務活動費充当額"
    let headerRow = -1;
    for (let i = 0; i < table.length; i++) {
      const t = table[i].join(" ");
      if (t.includes("支払年月日") && t.includes("充当")) {
        headerRow = i;
        break;
      }
    }
    if (headerRow === -1) continue;
    // 以降のデータ行を読む
    for (let i = headerRow + 1; i < table.length; i++) {
      const cells = table[i];
      // 「上記のとおり相違ない…」「氏名…」などフッタ行はスキップ
      const joined = cells.join(" ");
      if (
        joined.includes("上記のとおり") ||
        joined.includes("氏名") ||
        joined.includes("注1") ||
        joined.includes("経費の種別")
      )
        break;
      // 想定列: 支払年月日 / 支払総額 / 支払先 / 支払内容 / 充当額 / 備考
      if (cells.length < 5) continue;
      const date = tryParseDate(cells[0] ?? "", fiscalYear);
      if (!date) continue;
      const totalYen = num(cells[1] ?? "");
      const payee = (cells[2] ?? "").trim();
      const description = (cells[3] ?? "").trim();
      const allocatedYen = num(cells[4] ?? "");
      const note = (cells[5] ?? "").trim();
      if (!totalYen && !allocatedYen) continue;
      entries.push({
        id: randomUUID(),
        date,
        totalYen: Math.round(totalYen),
        payee,
        description,
        allocatedYen: Math.round(allocatedYen),
        note,
      });
    }
  }
  if (entries.length === 0) return null;

  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    fiscalYear,
    category: inferredCat,
    certifiedDate: "",
    signerName: "岩永 淳志",
    factionName: "みらいの会",
    representativeName: "岩永 淳志",
    entries,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 活動記録簿 docx を解析。1つのdocxに複数の活動記録（参考様式4が連続）が含まれる前提
 */
export async function parseActivityRecordDocx(
  buffer: Buffer,
  fiscalYear: number,
): Promise<ActivityRecord[]> {
  const xml = await readDocumentXml(buffer);
  const tables = parseTables(xml);
  // 活動記録のテーブル形式: 行の最初の列が「実 施 日」「実施場所」など
  const records: ActivityRecord[] = [];
  for (const table of tables) {
    let implementationDate = "";
    let location = "";
    let participants = "";
    let purposeContent = "";
    let factionMemberName = "岩永 淳志";
    let expenseRows: string[][] = [];
    for (const row of table) {
      if (row.length < 2) continue;
      const head = row[0].replace(/[\s　]/g, "");
      const val = row.slice(1).join(" ").trim();
      if (head.includes("実施日")) implementationDate = val;
      else if (head.includes("実施場所")) location = val;
      else if (head.includes("参加者") || head.includes("対象者")) participants = val;
      else if (head.includes("目的") || head.includes("内容")) purposeContent = val;
      else if (head.includes("会派") || head.includes("議員")) factionMemberName = val || factionMemberName;
      else if (head.includes("経費") && head.includes("種別")) {
        // 後続が支出明細
        continue;
      } else if (
        head.includes("ガソリン") ||
        head.includes("自家用車") ||
        head === "計" ||
        ALLOWED.some((c) => head.includes(c))
      ) {
        expenseRows.push(row);
      }
    }
    if (!implementationDate && !location && !purposeContent) continue;

    const expenses: ActivityExpense[] = [];
    for (const r of expenseRows) {
      if (r[0]?.replace(/[\s　]/g, "") === "計") continue;
      const cat = normCategory(r[0] ?? "");
      const description = (r[1] ?? "").trim();
      const totalYen = num(r[2] ?? "");
      const allocatedYen = num(r[3] ?? "");
      const note = (r[4] ?? "").trim();
      if (!totalYen && !allocatedYen) continue;
      expenses.push({
        id: randomUUID(),
        category: cat,
        description,
        totalYen: Math.round(totalYen),
        allocatedYen: Math.round(allocatedYen),
        note,
      });
    }

    const now = new Date().toISOString();
    records.push({
      id: randomUUID(),
      fiscalYear,
      factionMemberName,
      implementationDate,
      location,
      participants,
      purposeContent,
      expenses,
      outOfPrefecture: true,
      createdAt: now,
      updatedAt: now,
    });
  }
  return records;
}
