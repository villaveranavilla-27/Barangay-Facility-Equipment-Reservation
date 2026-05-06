import { NextResponse } from "next/server";
import { clearSessionCookie, revokeCurrentSession } from "@/lib/session";

export async function POST() {
  await revokeCurrentSession();

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);

  return response;
}
