import type { GoogleTokenSet } from "./google-auth";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  parents?: string[];
  size?: string;
}

const API = "https://www.googleapis.com/drive/v3";

export async function listChildren(
  token: GoogleTokenSet,
  folderId: string,
  pageToken?: string,
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "nextPageToken, files(id,name,mimeType,modifiedTime,parents,size)",
    pageSize: "200",
    orderBy: "name",
  });
  if (pageToken) params.set("pageToken", pageToken);
  const res = await fetch(`${API}/files?${params}`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!res.ok) {
    throw new Error(`Drive list failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as { files: DriveFile[]; nextPageToken?: string };
}

/** 再帰的にフォルダ配下の全ファイルを取得（フォルダ自体は除外）。サブフォルダ名を `path` に追加 */
export async function listAllUnder(
  token: GoogleTokenSet,
  rootId: string,
): Promise<(DriveFile & { path: string })[]> {
  const out: (DriveFile & { path: string })[] = [];
  const queue: { id: string; path: string }[] = [{ id: rootId, path: "" }];
  while (queue.length) {
    const cur = queue.shift()!;
    let pageToken: string | undefined;
    do {
      const { files, nextPageToken } = await listChildren(token, cur.id, pageToken);
      for (const f of files) {
        if (f.mimeType === "application/vnd.google-apps.folder") {
          queue.push({ id: f.id, path: cur.path ? `${cur.path}/${f.name}` : f.name });
        } else {
          out.push({ ...f, path: cur.path });
        }
      }
      pageToken = nextPageToken;
    } while (pageToken);
  }
  return out;
}

export async function downloadFile(
  token: GoogleTokenSet,
  fileId: string,
): Promise<Buffer> {
  const res = await fetch(`${API}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!res.ok) {
    throw new Error(`Drive download failed: ${res.status} ${await res.text()}`);
  }
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

export async function exportGoogleSheetAsXlsx(
  token: GoogleTokenSet,
  fileId: string,
): Promise<Buffer> {
  const res = await fetch(
    `${API}/files/${fileId}/export?mimeType=${encodeURIComponent(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )}`,
    { headers: { Authorization: `Bearer ${token.access_token}` } },
  );
  if (!res.ok) {
    throw new Error(`Drive export failed: ${res.status} ${await res.text()}`);
  }
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

export function isPdf(f: DriveFile): boolean {
  return f.mimeType === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
}
export function isImage(f: DriveFile): boolean {
  return (
    f.mimeType === "image/jpeg" ||
    f.mimeType === "image/png" ||
    /\.(jpe?g|png)$/i.test(f.name)
  );
}
export function isXlsx(f: DriveFile): boolean {
  return (
    f.mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    f.mimeType === "application/vnd.google-apps.spreadsheet" ||
    f.name.toLowerCase().endsWith(".xlsx")
  );
}
