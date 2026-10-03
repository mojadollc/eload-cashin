import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { generateUserId, generateWalletId, generateAccountNumber, generateReferralCode, generateOtp } from "@/lib/security/generators";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  mobile: z.string().regex(/^09\d{9}$/),
  email: z.string().email(),
  password: z.string().min(8),
  referralCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const messages = Object.values(fieldErrors).flat().join(". ");
      return NextResponse.json({ error: messages || "Validation failed" }, { status: 400 });
    }

    const { firstName, lastName, mobile, email, password, referralCode } = parsed.data;
    const existing = await prisma.user.findFirst({ where: { OR: [{ mobile }, { email }] } });
    if (existing) return NextResponse.json({ error: "Mobile or email already registered" }, { status: 409 });

    const count = await prisma.user.count();
    const seq = count + 1;
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx: any) => {
      const u = await tx.user.create({
        data: { userId: generateUserId(seq), firstName, lastName, mobile, email, passwordHash, referralCode: generateReferralCode(), referredBy: referralCode },
      });
      await tx.wallet.create({ data: { walletId: generateWalletId(seq), accountNumber: generateAccountNumber(), userId: u.id } });
      await tx.otpCode.create({ data: { userId: u.id, code: generateOtp(), type: "MOBILE_VERIFY", expiresAt: new Date(Date.now() + 10 * 60 * 1000) } });
      return u;
    });

    return NextResponse.json({ message: "Registration successful. Please verify your mobile.", userId: user.userId });
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: err?.message || "Registration failed" }, { status: 500 });
  }
}
