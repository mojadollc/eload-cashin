import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { generateOtp } from "@/lib/security/generators";
import { rateLimit } from "@/lib/mobile/rate-limit";
import { z } from "zod";

const schema = z.object({ mobile: z.string().regex(/^09\d{9}$/) });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = await rateLimit(`register-otp:${ip}`, 5, 60);
  if (!allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { mobile: parsed.data.mobile } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.otpCode.updateMany({
    where: { userId: user.id, type: "MOBILE_VERIFY", used: false },
    data: { used: true },
  });

  const code = generateOtp();
  await prisma.otpCode.create({
    data: { userId: user.id, code, type: "MOBILE_VERIFY", expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });

  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV] Register OTP for ${parsed.data.mobile}: ${code}`);
  }

  return NextResponse.json({ message: "OTP sent.", expiresIn: 600 });
}
