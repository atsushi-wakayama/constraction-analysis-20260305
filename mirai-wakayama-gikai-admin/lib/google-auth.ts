import { cookies } from "next/headers";
import { decryptJson, encryptJson } from "./crypto";

export const GOOGLE_TOKEN_COOKIE = "g_tok";
export const GOOGLE_STATE_COOKIE = "g_st";

const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "openid",
  "email",
  "profile",
].join(" ");

export interface GoogleTokenSet {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // ms epoch
  scope?: string;
  email?: string;
  name?: string;
  picture?: string;
}

export function googleConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function buildLoginUrl(state: string): string {
  const cid = process.env.GOOGLE_CLIENT_ID!;
  const redirect = process.env.GOOGLE_REDIRECT_URI ?? "";
  const params = new URLSearchParams({
    client_id: cid,
    redirect_uri: redirect,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCode(code: string): Promise<GoogleTokenSet> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? "",
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  const j = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
  };
  const tokens: GoogleTokenSet = {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_at: Date.now() + j.expires_in * 1000 - 60_000,
    scope: j.scope,
  };
  await fetchUserInfoInto(tokens);
  return tokens;
}

export async function refreshAccessToken(
  prev: GoogleTokenSet,
): Promise<GoogleTokenSet> {
  if (!prev.refresh_token) throw new Error("refresh_token がありません");
  const body = new URLSearchParams({
    refresh_token: prev.refresh_token,
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }
  const j = (await res.json()) as { access_token: string; expires_in: number };
  return {
    ...prev,
    access_token: j.access_token,
    expires_at: Date.now() + j.expires_in * 1000 - 60_000,
  };
}

async function fetchUserInfoInto(tokens: GoogleTokenSet) {
  try {
    const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (res.ok) {
      const j = (await res.json()) as { email?: string; name?: string; picture?: string };
      tokens.email = j.email;
      tokens.name = j.name;
      tokens.picture = j.picture;
    }
  } catch {
    /* ignore */
  }
}

export async function getStoredTokens(): Promise<GoogleTokenSet | null> {
  const c = await cookies();
  const v = c.get(GOOGLE_TOKEN_COOKIE)?.value;
  if (!v) return null;
  return await decryptJson<GoogleTokenSet>(v);
}

export async function ensureFreshToken(): Promise<GoogleTokenSet | null> {
  const t = await getStoredTokens();
  if (!t) return null;
  if (t.expires_at > Date.now()) return t;
  if (!t.refresh_token) return null;
  const fresh = await refreshAccessToken(t);
  // 更新したcookieは route handler 側で書き戻す必要がある
  return fresh;
}

export async function tokenCookieValue(t: GoogleTokenSet): Promise<string> {
  return await encryptJson(t);
}
