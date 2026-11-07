import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/landing"];
const PUBLIC_API = ["/api/auth/login", "/api/auth/register", "/api/auth/verify-otp", "/api/auth/forgot-password", "/api/auth/reset-password", "/api/auth/refresh", "/api/mobile/auth/"];

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

  // API routes - let auth APIs through
  if (pathname.startsWith("/api/")) {
    if (PUBLIC_API.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }
    // Protect API routes that need auth
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Public routes - redirect authenticated users away
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  if (isPublicRoute && isAuthenticated) {
    const redirectTo = ["SUPER_ADMIN", "ADMIN", "FINANCE", "SUPPORT"].includes(userRole || "") ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  // Protected routes - redirect unauthenticated users to login
  const isProtectedRoute = pathname.startsWith("/dashboard") || 
                           pathname.startsWith("/admin") || 
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

  // Admin-only routes
  if (pathname.startsWith("/admin") && userRole && !["SUPER_ADMIN", "ADMIN", "FINANCE", "SUPPORT"].includes(userRole)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};