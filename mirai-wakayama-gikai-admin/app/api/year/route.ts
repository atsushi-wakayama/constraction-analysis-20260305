import { NextRequest, NextResponse } from "next/server";
import { ACTIVE_YEAR_COOKIE } from "@/lib/active-year";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const yearRaw = Number(form.get("year"));
  const back = String(form.get("back") ?? "/") || "/";
  const target = back.startsWith("/") ? back : "/";
  const res = NextResponse.redirect(new URL(target, req.nextUrl.origin));
  if (Number.isFinite(yearRaw) && yearRaw > 0) {
    res.cookies.set(ACTIVE_YEAR_COOKIE, String(Math.trunc(yearRaw)), {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}
