import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { getAdminAuth } from "@/lib/firebase/admin";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { rateLimit } from "@/lib/mobile/rate-limit";
import { z } from "zod";

const schema = z.object({
  mobile: z.string().regex(/^09\d{9}$/),
  firebaseToken: z.string().min(1),
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

  const { mobile, firebaseToken } = parsed.data;

  // Verify Firebase token
  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(firebaseToken);
  } catch {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
  }

  // Verify phone number matches
  const normalizedMobile = "+63" + mobile.slice(1);
  if (decoded.phone_number !== normalizedMobile) {
    return NextResponse.json({ error: "Phone number mismatch" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { mobile },
    include: { pin: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.status === "SUSPENDED") return NextResponse.json({ error: "Account suspended" }, { status: 403 });

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
