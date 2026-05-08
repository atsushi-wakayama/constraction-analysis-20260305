import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { RECEIPT_IMAGE_DIR } from "./storage";

const DPI = "150";

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (b) => (stderr += b.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited ${code}: ${stderr}`));
    });
  });
}

/**
 * PDFを各ページのJPEG画像に変換し、receipt-images/ に保存する。
 * 戻り値は保存されたファイル名（拡張子込み）の配列（1ページ目→…）。
 */
export async function pdfToJpegPages(pdfBuffer: Buffer): Promise<string[]> {
  await fs.mkdir(RECEIPT_IMAGE_DIR, { recursive: true });
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdfconv-"));
  try {
    const pdfPath = path.join(tmpDir, "in.pdf");
    await fs.writeFile(pdfPath, pdfBuffer);
    const prefix = path.join(tmpDir, "page");
    // -jpeg: JPEG output, -r DPI, prefix-N.jpg
    await run("pdftoppm", ["-jpeg", "-r", DPI, pdfPath, prefix]);
    const entries = (await fs.readdir(tmpDir))
      .filter((f) => f.startsWith("page") && f.endsWith(".jpg"))
      .sort((a, b) => {
        const na = Number(a.match(/-(\d+)\.jpg$/)?.[1] ?? 0);
        const nb = Number(b.match(/-(\d+)\.jpg$/)?.[1] ?? 0);
        return na - nb;
      });
    const saved: string[] = [];
    const batch = randomUUID();
    for (let i = 0; i < entries.length; i++) {
      const src = path.join(tmpDir, entries[i]);
      const filename = `${batch}-${i + 1}.jpg`;
      const dest = path.join(RECEIPT_IMAGE_DIR, filename);
      await fs.copyFile(src, dest);
      saved.push(filename);
    }
    return saved;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

export async function saveImageBuffer(
  buffer: Buffer,
  ext: "jpg" | "jpeg" | "png",
): Promise<string> {
  await fs.mkdir(RECEIPT_IMAGE_DIR, { recursive: true });
  const filename = `${randomUUID()}.${ext === "jpeg" ? "jpg" : ext}`;
  await fs.writeFile(path.join(RECEIPT_IMAGE_DIR, filename), buffer);
  return filename;
}
