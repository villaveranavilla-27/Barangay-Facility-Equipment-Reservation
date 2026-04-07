import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const authPaths = ["/login", "/register", "/admin-login"];
const protectedUserPaths = ["/user"];
const protectedAdminPaths = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));
  const isUserPath = protectedUserPaths.some((path) => pathname.startsWith(path));
  const isAdminPath = protectedAdminPaths.some((path) => pathname.startsWith(path));

  if (isAuthPath && token?.role) {
    const destination = token.role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (isUserPath) {
    if (!token) return NextResponse.redirect(new URL("/login", request.url));
    if (token.role !== "USER") return NextResponse.redirect(new URL("/admin-login", request.url));
  }

  if (isAdminPath) {
    if (!token) return NextResponse.redirect(new URL("/admin-login", request.url));
    if (token.role !== "ADMIN") return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/admin-login", "/user/:path*", "/admin/:path*"]
};
