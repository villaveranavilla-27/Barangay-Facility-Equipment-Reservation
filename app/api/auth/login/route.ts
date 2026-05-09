import { NextResponse } from "next/server";
import { authenticateCredentials } from "@/lib/auth";
import {
  applySessionCookie,
  createSessionForUser,
  getSessionHomePath,
  revokeCurrentSession,
} from "@/lib/session";

export async function POST(request: Request) {
  try {
    const credentials = await request.json();
    const user = await authenticateCredentials(credentials);

    await revokeCurrentSession();

    const sessionId = await createSessionForUser(user, {
      headers: request.headers,
    });

    const response = NextResponse.json({
      ok: true,
      role: user.role,
      destination: getSessionHomePath(user),
    });

    applySessionCookie(response, sessionId);
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sign in.";
    const status = message === "Missing login fields" ? 400 : 401;

    return NextResponse.json({ error: message }, { status });
  }
}
