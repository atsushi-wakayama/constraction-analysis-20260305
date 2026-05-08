import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { RECEIPT_IMAGE_DIR } from "@/lib/storage";

type Ctx = { params: Promise<{ file: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { file } = await params;
  // path traversal対策: basenameのみ許可
  const safe = path.basename(file);
  if (safe !== file || !/^[a-zA-Z0-9._-]+$/.test(safe)) {
    return NextResponse.json({ error: "invalid filename" }, { status: 400 });
  }
  const fullPath = path.join(RECEIPT_IMAGE_DIR, safe);
  let data: Buffer;
  try {
    data = await fs.readFile(fullPath);
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const ext = path.extname(safe).toLowerCase();
  const type =
    ext === ".png"
      ? "image/png"
      : ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : "application/octet-stream";
  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, max-age=300",
    },
  });
}
