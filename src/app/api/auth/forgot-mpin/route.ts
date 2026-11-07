import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const resetPinSchema = z.object({
  mobile: z.string(),
  firebaseToken: z.string(),
  newPin: z.string().length(4).regex(/^\d{4}$/),
});

async function verifyFirebaseToken(token: string, expectedPhone: string): Promise<boolean> {
  try {
    const { getAdminAuth } = await import("@/lib/firebase/admin");
    const decoded = await getAdminAuth().verifyIdToken(token);
    const normalizedMobile = expectedPhone.replace(/^0/, "+63");
    return decoded.phone_number === normalizedMobile;
  } catch {
    return false;
  }
}

async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

// POST /api/auth/forgot-mpin - Reset MPIN after OTP verification
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = resetPinSchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { mobile, firebaseToken, newPin } = parsed.data;

  // Verify Firebase token
  const isValidToken = await verifyFirebaseToken(firebaseToken, mobile);
  if (!isValidToken) {
    return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 });
  }

  // Find user
  const user = await prisma.user.findUnique({ where: { mobile } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Hash new PIN
  const pinHash = await hashPin(newPin);

  // Upsert PIN (create or update)
  await prisma.userPin.upsert({
    where: { userId: user.id },
    create: { userId: user.id, pinHash, biometricsEnabled: false },
    update: { pinHash, biometricsEnabled: false },
  });

  return NextResponse.json({ 
    success: true, 
    message: "MPIN reset successfully" 
  });
}