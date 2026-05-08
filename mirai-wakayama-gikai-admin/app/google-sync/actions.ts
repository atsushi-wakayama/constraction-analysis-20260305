"use server";

import path from "node:path";
import { promises as fs } from "node:fs";
import { revalidatePath } from "next/cache";
import { ensureFreshToken } from "@/lib/google-auth";
import {
  downloadFile,
  exportGoogleSheetAsXlsx,
  isImage,
  isPdf,
  isXlsx,
  listAllUnder,
} from "@/lib/google-drive";
import { pdfToJpegPages, saveImageBuffer } from "@/lib/pdf-convert";
import {
  createReceipt,
  RECEIPT_IMAGE_DIR,
} from "@/lib/storage";
import { getActiveYear } from "@/lib/active-year";
import type { ExpenseCategory } from "@/lib/types";

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

function pickCategoryFromPath(filePath: string): ExpenseCategory {
  for (const c of ALLOWED) {
    if (filePath.includes(c)) return c;
  }
  // fall-back
  if (filePath.includes("広報")) return "広報広聴費";
  if (filePath.includes("陳情")) return "要請陳情活動費";
  return "調査研究費";
}

const DATA_DIR = path.join(process.cwd(), "data");
const STATE_FILE = path.join(DATA_DIR, "google-sync-state.json");

interface SyncState {
  receiptFileIds?: string[]; // already imported file ids
  lastSync?: string;
}

async function readState(): Promise<SyncState> {
  try {
    const buf = await fs.readFile(STATE_FILE, "utf8");
    return JSON.parse(buf) as SyncState;
  } catch {
    return {};
  }
}
async function writeState(s: SyncState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(s, null, 2), "utf8");
}

function folderId(): string {
  return process.env.GOOGLE_DRIVE_FOLDER_ID ?? "";
}

export async function syncReceiptsAction(): Promise<{
  added: number;
  skipped: number;
  errors: { name: string; error: string }[];
}> {
  const token = await ensureFreshToken();
  if (!token) throw new Error("Google にログインしてください");
  const fid = folderId();
  if (!fid) throw new Error("GOOGLE_DRIVE_FOLDER_ID が未設定");

  const files = await listAllUnder(token, fid);
  const state = await readState();
  const known = new Set(state.receiptFileIds ?? []);
  const fiscalYear = await getActiveYear();

  let added = 0;
  let skipped = 0;
  const errors: { name: string; error: string }[] = [];

  for (const f of files) {
    if (!isPdf(f) && !isImage(f)) continue;
    if (known.has(f.id)) {
      skipped += 1;
      continue;
    }
    try {
      const buf = await downloadFile(token, f.id);
      const category = pickCategoryFromPath(f.path);
      if (isPdf(f)) {
        const pages = await pdfToJpegPages(buf);
        for (let i = 0; i < pages.length; i++) {
          await createReceipt({
            fiscalYear,
            category,
            date: "",
            payee: "",
            totalYen: 0,
            allocatedYen: 0,
            description: "",
            note: `Drive: ${f.path ? f.path + "/" : ""}${f.name}`,
            imageFile: pages[i],
            sourcePdf: f.name,
            pageNumber: i + 1,
            mimeType: "image/jpeg",
          });
        }
        added += pages.length;
      } else {
        const lower = f.name.toLowerCase();
        const ext: "jpg" | "png" = lower.endsWith(".png") ? "png" : "jpg";
        const filename = await saveImageBuffer(buf, ext);
        await createReceipt({
          fiscalYear,
          category,
          date: "",
          payee: "",
          totalYen: 0,
          allocatedYen: 0,
          description: "",
          note: `Drive: ${f.path ? f.path + "/" : ""}${f.name}`,
          imageFile: filename,
          mimeType: ext === "png" ? "image/png" : "image/jpeg",
        });
        added += 1;
      }
      known.add(f.id);
    } catch (err) {
      errors.push({ name: f.name, error: String(err) });
    }
  }

  await writeState({
    ...state,
    receiptFileIds: [...known],
    lastSync: new Date().toISOString(),
  });
  revalidatePath("/forms/receipt");
  revalidatePath("/google-sync");
  revalidatePath("/");
  return { added, skipped, errors };
}

export async function backupJsonAction(): Promise<{
  uploaded: { name: string; size: number }[];
  error?: string;
}> {
  const token = await ensureFreshToken();
  if (!token) throw new Error("Google にログインしてください");
  const fid = folderId();
  if (!fid) throw new Error("GOOGLE_DRIVE_FOLDER_ID が未設定");

  const files = ["payments.json", "activities.json", "ledger.json", "vehicle-trips.json", "receipts.json"];
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFolderName = `admin-backup-${stamp}`;

  // backup folderを作る
  const folderRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: backupFolderName,
      parents: [fid],
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  if (!folderRes.ok) {
    return { uploaded: [], error: `folder create failed: ${await folderRes.text()}` };
  }
  const { id: backupId } = (await folderRes.json()) as { id: string };

  const uploaded: { name: string; size: number }[] = [];
  for (const filename of files) {
    const filepath = path.join(DATA_DIR, filename);
    let content: string;
    try {
      content = await fs.readFile(filepath, "utf8");
    } catch {
      continue;
    }
    const boundary = "---admin-backup-" + Math.random().toString(36).slice(2);
    const meta = {
      name: filename,
      parents: [backupId],
      mimeType: "application/json",
    };
    const body =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(meta) +
      `\r\n--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      content +
      `\r\n--${boundary}--`;
    const upRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      },
    );
    if (upRes.ok) {
      uploaded.push({ name: filename, size: content.length });
    }
  }
  return { uploaded };
}

export async function importLedgerXlsxAction(): Promise<{
  message: string;
  files?: string[];
}> {
  const token = await ensureFreshToken();
  if (!token) throw new Error("Google にログインしてください");
  const fid = folderId();
  if (!fid) throw new Error("GOOGLE_DRIVE_FOLDER_ID が未設定");
  const all = await listAllUnder(token, fid);
  const xlsxFiles = all.filter(isXlsx);
  // ここではファイル一覧を返すだけ（パースは将来追加）
  return {
    message: `xlsx候補 ${xlsxFiles.length} 件を発見しました。自動取り込みは Phase 2 で対応予定です。`,
    files: xlsxFiles.map((f) => `${f.path ? f.path + "/" : ""}${f.name}`),
  };
}
