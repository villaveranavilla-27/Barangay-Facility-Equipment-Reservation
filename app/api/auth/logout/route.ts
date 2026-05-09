import { NextResponse } from "next/server";
import { clearSessionCookie, revokeCurrentSession } from "@/lib/session";

export async function POST(request: Request) {
  await revokeCurrentSession({
    headers: request.headers,
  });

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);

  return response;
}
