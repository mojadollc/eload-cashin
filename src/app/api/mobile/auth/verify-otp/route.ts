import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { rateLimit } from "@/lib/mobile/rate-limit";
import { z } from "zod";

const schema = z.object({
  mobile: z.string().regex(/^09\d{9}$/),
  code: z.string().length(6),
});

async function getLocationFromIP(ip: string): Promise<string | null> {
  if (!ip || ip === "unknown" || ip === "127.0.0.1") return null;
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`).catch(() => null);
    if (!res) return null;
    const data = await res.json() as { status: string; city: string; regionName: string; country: string };
    if (data.status === "success") return `${data.city}, ${data.regionName}, ${data.country}`;
    return null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = await rateLimit(`verify-otp:${ip}`, 10, 60);
  if (!allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { mobile, code } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { mobile },
    include: { pin: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.status === "SUSPENDED") return NextResponse.json({ error: "Account suspended" }, { status: 403 });

  const otp = await prisma.otpCode.findFirst({
    where: {
      userId: user.id,
      type: { in: ["MOBILE_LOGIN", "MOBILE_VERIFY"] },
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.code !== code) {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
  }

  // Mark OTP used
  await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

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

  return NextResponse.json({
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
}
