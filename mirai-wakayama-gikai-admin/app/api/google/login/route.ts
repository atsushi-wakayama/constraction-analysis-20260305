import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  GOOGLE_STATE_COOKIE,
  buildLoginUrl,
  googleConfigured,
} from "@/lib/google-auth";

export async function GET(req: NextRequest) {
  if (!googleConfigured()) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET 未設定" },
      { status: 500 },
    );
  }
  const state = randomUUID();
  const url = buildLoginUrl(state);
  const res = NextResponse.redirect(url);
  res.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}
