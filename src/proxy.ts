import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/landing", "/admin-access", "/forgot-mpin"];
const PUBLIC_API = ["/api/auth/login", "/api/auth/register", "/api/auth/verify-otp", "/api/auth/forgot-password", "/api/auth/reset-password", "/api/auth/refresh", "/api/mobile/auth/", "/api/auth/forgot-mpin"];

function getTokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return req.cookies.get("access_token")?.value || null;
}

function verifyToken(token: string): { valid: boolean; role?: string } {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp * 1000 < Date.now()) return { valid: false };
    return { valid: true, role: payload.role };
  } catch {
    return { valid: false };
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = getTokenFromRequest(req);
  const isAuthenticated = token ? verifyToken(token).valid : false;
  const userRole = token ? verifyToken(token).role : null;

  // API routes
  if (pathname.startsWith("/api/")) {
    if (PUBLIC_API.some(route => pathname.startsWith(route))) return NextResponse.next();
    if (!isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.next();
  }

  // Always allow admin-access page through — no redirects
  if (pathname.startsWith("/admin-access")) {
    return NextResponse.next();
  }

  // Never redirect the landing page
  if (pathname === "/") {
    return NextResponse.next();
  }

  // login/register — never auto-redirect, let the page handle it
  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.next();
  }

  // Public routes — redirect authenticated users away (except login/register handled above)
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  if (isPublicRoute && isAuthenticated) {
    const redirectTo = ["SUPER_ADMIN", "ADMIN", "FINANCE", "SUPPORT"].includes(userRole || "") ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  // Admin routes — redirect unauthenticated to admin-access
  if (pathname.startsWith("/admin") && !isAuthenticated) {
    return NextResponse.redirect(new URL("/admin-access?k=ct-admin-9x7k2m", req.url));
  }

  // Admin routes — redirect non-admin to dashboard
  if (pathname.startsWith("/admin") && userRole && !["SUPER_ADMIN", "ADMIN", "FINANCE", "SUPPORT"].includes(userRole)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protected user routes
  const isProtectedRoute = pathname.startsWith("/dashboard") ||
                           pathname.startsWith("/wallet") ||
                           pathname.startsWith("/eload") ||
                           pathname.startsWith("/cashout") ||
                           pathname.startsWith("/transfer") ||
                           pathname.startsWith("/transactions") ||
                           pathname.startsWith("/profile") ||
                           pathname.startsWith("/notifications") ||
                           pathname.startsWith("/support");

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};