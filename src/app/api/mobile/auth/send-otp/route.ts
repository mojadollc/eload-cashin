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

  await sendSms(mobile, `Your CashIn Tap OTP is: ${code}. Valid for 10 minutes. Do not share this code.`);

  return NextResponse.json({ message: "OTP sent successfully.", expiresIn: 600 });
}

async function sendSms(mobile: string, message: string): Promise<void> {
  const apiKey = process.env.SEMAPHORE_API_KEY;
  if (!apiKey) {
    console.log(`[DEV] OTP for ${mobile}: ${message}`);
    return;
  }
  const res = await fetch("https://api.semaphore.co/api/v4/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: apiKey,
      number: mobile,
      message,
      sendername: process.env.SEMAPHORE_SENDER_NAME ?? "CASHIN",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("[SMS] Semaphore error:", err);
    throw new Error("Failed to send SMS");
  }
}
