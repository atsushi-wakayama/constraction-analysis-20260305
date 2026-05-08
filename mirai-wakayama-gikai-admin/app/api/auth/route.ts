import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_MAX_AGE,
  SESSION_COOKIE_NAME,
  checkPassword,
  issueToken,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const action = form.get("action");
  const origin = req.nextUrl.origin;

  if (action === "logout") {
    const res = NextResponse.redirect(new URL("/login", origin));
    res.cookies.delete(SESSION_COOKIE_NAME);
    return res;
  }

  const password = String(form.get("password") ?? "");
  const from = String(form.get("from") ?? "/") || "/";
  if (!checkPassword(password)) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", "1");
    if (from !== "/") url.searchParams.set("from", from);
    return NextResponse.redirect(url);
  }

  const target = from.startsWith("/") ? from : "/";
  const res = NextResponse.redirect(new URL(target, origin));
  res.cookies.set(SESSION_COOKIE_NAME, await issueToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
  return res;
}
