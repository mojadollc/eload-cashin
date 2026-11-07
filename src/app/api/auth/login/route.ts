import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { rateLimit } from "@/lib/mobile/rate-limit";

const otpLoginSchema = z.object({
  mobile: z.string(),
  firebaseToken: z.string(),
});

const passwordLoginSchema = z.object({
  mobile: z.string(),
  password: z.string().min(1),
});

async function getLocationFromIP(ip: string): Promise<string | null> {
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "localhost") return null;
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`).catch(() => null);
    if (!res) return null;
    const data = await res.json() as { status: string; country: string; regionName: string; city: string };
    if (data.status === "success" && data.city) return `${data.city}, ${data.regionName}, ${data.country}`;
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  const { allowed } = await rateLimit(`login:${ip}`, 10, 60);
  if (!allowed) return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });

  const body = await req.json();

  // Password-based login for admin/staff
  const pwParsed = passwordLoginSchema.safeParse(body);
  if (pwParsed.success && pwParsed.data.password) {
    const { mobile, password } = pwParsed.data;
    const user = await prisma.user.findUnique({ where: { mobile }, include: { pin: true } });
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "FINANCE", "SUPPORT"];
    if (!ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json({ error: "Password login is for admin accounts only" }, { status: 403 });
    }
    if (!user.passwordHash) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    if (user.status === "SUSPENDED") return NextResponse.json({ error: "Account suspended" }, { status: 403 });

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, role: user.role });
    const location = await getLocationFromIP(ip);
    await prisma.session.create({
      data: { userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), ipAddress: ip, location },
    });
    const res = NextResponse.json({
      accessToken, refreshToken, requiresMpin: !!user.pin,
      user: { id: user.userId, firstName: user.firstName, lastName: user.lastName, role: user.role, mobile: user.mobile, email: user.email, hasPin: !!user.pin, biometricsEnabled: user.pin?.biometricsEnabled ?? false },
    });
    res.cookies.set("access_token", accessToken, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 900 });
    res.cookies.set("refresh_token", refreshToken, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 604800 });
    return res;
  }

  // OTP-based login (mobile + firebaseToken)
  const parsed = otpLoginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { mobile, firebaseToken } = parsed.data;

  try {
    const { getAdminAuth } = await import("@/lib/firebase/admin");
    const decoded = await getAdminAuth().verifyIdToken(firebaseToken);
    const normalizedMobile = mobile.replace(/^0/, "+63");
    if (decoded.phone_number !== normalizedMobile) {
      return NextResponse.json({ error: "Phone number mismatch" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { mobile },
    include: { pin: true },
  });

  if (!user) return NextResponse.json({ error: "No account found. Please register first." }, { status: 404 });
  if (user.status === "SUSPENDED") return NextResponse.json({ error: "Account suspended" }, { status: 403 });

  // Mark mobile verified if not already
  if (!user.mobileVerified) {
    await prisma.user.update({ where: { id: user.id }, data: { mobileVerified: true, status: "ACTIVE" } });
  }

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role });
  const location = await getLocationFromIP(ip);

  await prisma.session.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: ip,
      location,
    },
  });

  const res = NextResponse.json({
    accessToken,
    refreshToken,
    requiresMpin: !!user.pin,
    user: {
      id: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      mobile: user.mobile,
      email: user.email,
      hasPin: !!user.pin,
      biometricsEnabled: user.pin?.biometricsEnabled ?? false,
    },
  });

  res.cookies.set("access_token", accessToken, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 900 });
  res.cookies.set("refresh_token", refreshToken, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 604800 });
  return res;
}
