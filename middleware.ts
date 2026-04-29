// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isInactiveAdmin, isInactiveUser } from "@/lib/access";

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

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const effectiveToken =
    isInactiveAdmin(token) || isInactiveUser(token) ? null : token;
  const role = effectiveToken?.role;

  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));
  const isUserPath = protectedUserPaths.some((path) => pathname.startsWith(path));
  const isAdminPath = protectedAdminPaths.some((path) => pathname.startsWith(path));

  // Redirect logged-in users away from auth pages
  if (isAuthPath && effectiveToken) {
    const destination = role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Protect user routes
  if (isUserPath) {
    if (!effectiveToken) return NextResponse.redirect(new URL("/login", request.url));
    if (role !== "USER") return NextResponse.redirect(new URL("/admin-login", request.url));
  }

  // Protect admin routes
  if (isAdminPath) {
    if (!effectiveToken) return NextResponse.redirect(new URL("/admin-login", request.url));
    if (role !== "ADMIN") return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.next();

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
  matcher: [
    "/login/:path*",
    "/register/:path*",
    "/admin-login/:path*",
    "/user/:path*",
    "/admin/:path*",
  ],
};
