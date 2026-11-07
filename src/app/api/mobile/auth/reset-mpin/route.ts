import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { generateOtp } from "@/lib/security/generators";
import { rateLimit } from "@/lib/mobile/rate-limit";
import { z } from "zod";

const sendSchema = z.object({
  mobile: z.string().regex(/^09\d{9}$/),
});

const resetSchema = z.object({
  mobile: z.string().regex(/^09\d{9}$/),
  firebaseToken: z.string().min(1),
  newPin: z.string().length(4).regex(/^\d{4}$/),
});

// POST with just mobile = send OTP
// POST with mobile + code + newPin = verify & reset
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = await rateLimit(`reset-mpin:${ip}`, 5, 60);
  if (!allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const body = await req.json().catch(() => ({}));

  // Step 1: send OTP
  if (!("code" in body)) {
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { mobile: parsed.data.mobile } });
    if (!user) return NextResponse.json({ error: "No account found with this number." }, { status: 404 });

    await prisma.otpCode.updateMany({
      where: { userId: user.id, type: "RESET_MPIN", used: false },
      data: { used: true },
    });

    const code = generateOtp();
    await prisma.otpCode.create({
      data: { userId: user.id, code, type: "RESET_MPIN", expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });

    await sendSms(parsed.data.mobile, `Your CashIn Tap OTP is: ${code}. Valid for 10 minutes. Do not share this code.`);

    return NextResponse.json({ message: "OTP sent successfully.", expiresIn: 600 });
  }

  // Step 2: verify Firebase token + reset MPIN
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { mobile, firebaseToken, newPin } = parsed.data;

  // Verify Firebase token
  const { getAdminAuth } = await import("@/lib/firebase/admin");
  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(firebaseToken);
  } catch {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
  }

  const normalizedMobile = "+63" + mobile.slice(1);
  if (decoded.phone_number !== normalizedMobile) {
    return NextResponse.json({ error: "Phone number mismatch" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { mobile } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const bcrypt = await import("bcryptjs");
  const pinHash = await bcrypt.hash(newPin, 10);

  await prisma.userPin.upsert({
    where: { userId: user.id },
    create: { userId: user.id, pinHash, biometricsEnabled: false },
    update: { pinHash, biometricsEnabled: false },
  });

  return NextResponse.json({ success: true, message: "MPIN reset successfully" });
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
  if (!res.ok) throw new Error("Failed to send SMS");
}
