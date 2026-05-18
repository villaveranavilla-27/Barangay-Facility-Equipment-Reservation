import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

const authPaths = ["/login", "/register", "/admin-login"];
const protectedUserPaths = ["/user/"];
const protectedAdminPaths = ["/admin/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  for (const authPath of authPaths) {
    if (pathname.startsWith(`${authPath}/`)) {
      const normalizedUrl = request.nextUrl.clone();
      normalizedUrl.pathname = pathname.slice(authPath.length) || "/";
      return NextResponse.redirect(normalizedUrl);
    }
  }

  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));
  const isUserPath = protectedUserPaths.some((path) => pathname.startsWith(path));
  const isAdminPath = protectedAdminPaths.some((path) => pathname.startsWith(path));

  const response = await updateSession(request);

  if (isAuthPath || isUserPath || isAdminPath) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
