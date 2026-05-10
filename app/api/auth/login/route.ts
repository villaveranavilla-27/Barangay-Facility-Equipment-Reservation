import { NextResponse } from "next/server";
import { AuthenticationError, authenticateCredentials } from "@/lib/auth";
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
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[/api/auth/login] unexpected failure", error);
    return NextResponse.json(
      { error: "Unable to sign in right now. Please try again." },
      { status: 500 }
    );
  }
}
