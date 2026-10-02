import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";

const schema = z.object({
  mobile: z.string(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { mobile, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { mobile } });
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  if (user.status === "SUSPENDED") return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  if (!user.mobileVerified) return NextResponse.json({ error: "Please verify your mobile number" }, { status: 403 });

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

  await prisma.session.create({
    data: { userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });

  const res = NextResponse.json({
    accessToken,
    user: { id: user.userId, firstName: user.firstName, lastName: user.lastName, role: user.role },
  });
  res.cookies.set("access_token", accessToken, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 900 });
  res.cookies.set("refresh_token", refreshToken, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 604800 });
  return res;
}
