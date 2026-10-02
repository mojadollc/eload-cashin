import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, JwtPayload } from "./jwt";
import { UserRole } from "@/types/enums";

export function getTokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return req.cookies.get("access_token")?.value || null;
}

export function requireAuth(
  handler: (req: NextRequest, payload: JwtPayload) => Promise<NextResponse>,
  roles?: UserRole[]
) {
  return async (req: NextRequest) => {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
      const payload = verifyAccessToken(token);
      if (roles && !roles.includes(payload.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      return handler(req, payload);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  };
}

export const ADMIN_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.FINANCE,
  UserRole.SUPPORT,
];
