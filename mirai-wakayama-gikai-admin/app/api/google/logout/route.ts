import { NextRequest, NextResponse } from "next/server";
import { GOOGLE_TOKEN_COOKIE } from "@/lib/google-auth";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/google-sync", req.nextUrl.origin));
  res.cookies.delete(GOOGLE_TOKEN_COOKIE);
  return res;
}
