import { NextRequest, NextResponse } from "next/server";
import {
  GOOGLE_STATE_COOKIE,
  GOOGLE_TOKEN_COOKIE,
  exchangeCode,
  tokenCookieValue,
} from "@/lib/google-auth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expected = req.cookies.get(GOOGLE_STATE_COOKIE)?.value;

  if (!code || !state || state !== expected) {
    return NextResponse.json({ error: "invalid state" }, { status: 400 });
  }

  try {
    const tokens = await exchangeCode(code);
    const v = await tokenCookieValue(tokens);
    const url = new URL("/google-sync", req.nextUrl.origin);
    const res = NextResponse.redirect(url);
    res.cookies.delete(GOOGLE_STATE_COOKIE);
    res.cookies.set(GOOGLE_TOKEN_COOKIE, v, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 60, // 60日
    });
    return res;
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
