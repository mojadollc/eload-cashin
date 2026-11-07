import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { z } from "zod";
import { generateUserId, generateWalletId, generateAccountNumber, generateReferralCode } from "@/lib/security/generators";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  mobile: z.string().regex(/^09\d{9}$/),
  email: z.string().email(),
  referralCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const messages = Object.values(parsed.error.flatten().fieldErrors).flat().join(". ");
      return NextResponse.json({ error: messages || "Validation failed" }, { status: 400 });
    }

    const { firstName, lastName, mobile, email, referralCode } = parsed.data;
    const existing = await prisma.user.findFirst({ where: { OR: [{ mobile }, { email }] } });

    // Unverified user — allow re-registration
    if (existing && !existing.mobileVerified) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { firstName, lastName, email },
      });
      return NextResponse.json({ message: "Registration updated. Please verify your mobile.", userId: existing.userId });
    }

    if (existing) {
      return NextResponse.json({ error: "Mobile or email already registered. Please login.", verified: true }, { status: 409 });
    }

    const count = await prisma.user.count();
    const seq = count + 1;

    const user = await prisma.$transaction(async (tx: any) => {
      const u = await tx.user.create({
        data: {
          userId: generateUserId(seq),
          firstName,
          lastName,
          mobile,
          email,
          referralCode: generateReferralCode(),
          referredBy: referralCode,
        },
      });
      await tx.wallet.create({
        data: { walletId: generateWalletId(seq), accountNumber: generateAccountNumber(), userId: u.id },
      });
      return u;
    });

    return NextResponse.json({ message: "Registration successful. Please verify your mobile.", userId: user.userId });
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: err?.message || "Registration failed" }, { status: 500 });
  }
}
