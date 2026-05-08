// AES-GCM暗号化ヘルパ。SESSION_SECRET から派生したキーで encrypt/decrypt。

const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET ?? "";
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET is not set");
  }
  const raw = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u;
}

export async function encryptJson(value: unknown): Promise<string> {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = enc.encode(JSON.stringify(value));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data),
  );
  // iv | ct
  const merged = new Uint8Array(iv.length + ct.length);
  merged.set(iv, 0);
  merged.set(ct, iv.length);
  return toB64(merged);
}

export async function decryptJson<T = unknown>(token: string): Promise<T | null> {
  try {
    const buf = fromB64(token);
    const iv = buf.slice(0, 12);
    const ct = buf.slice(12);
    const key = await deriveKey();
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return JSON.parse(dec.decode(pt)) as T;
  } catch {
    return null;
  }
}
