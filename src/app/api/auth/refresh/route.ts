import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { verifyRefreshToken, signAccessToken } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;
  if (!refreshToken) return NextResponse.json({ error: "No refresh token" }, { status: 401 });

  try {
    const payload = verifyRefreshToken(refreshToken);

    const session = await prisma.session.findUnique({ where: { token: refreshToken } });
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const accessToken = signAccessToken({ userId: payload.userId, role: payload.role });

    const res = NextResponse.json({ accessToken });
    res.cookies.set("access_token", accessToken, {
      httpOnly: true, secure: true, sameSite: "strict", maxAge: 900,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }
}
