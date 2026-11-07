import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { generateOtp } from "@/lib/security/generators";
import { rateLimit } from "@/lib/mobile/rate-limit";
import { z } from "zod";

const schema = z.object({
  mobile: z.string().regex(/^09\d{9}$/, "Invalid mobile number"),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = await rateLimit(`send-otp:${ip}`, 5, 60);
  if (!allowed) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { mobile } = parsed.data;

  const user = await prisma.user.findUnique({ where: { mobile } });
  if (!user) return NextResponse.json({ error: "No account found with this number. Please register first." }, { status: 404 });

  // Invalidate old OTPs
  await prisma.otpCode.updateMany({
    where: { userId: user.id, type: "MOBILE_LOGIN", used: false },
    data: { used: true },
  });

  const code = generateOtp();
  await prisma.otpCode.create({
    data: {
      userId: user.id,
      code,
      type: "MOBILE_LOGIN",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  // TODO: Send SMS via your SMS provider (Semaphore, Vonage, etc.)
  // For now, log in dev — remove before production
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV] OTP for ${mobile}: ${code}`);
  }

  return NextResponse.json({ message: "OTP sent successfully.", expiresIn: 600 });
}
