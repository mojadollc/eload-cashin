import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { verifyAccessToken } from "@/lib/auth/jwt";

const setPinSchema = z.object({
  pin: z.string().length(4, "PIN must be 4 digits").regex(/^\d{4}$/, "PIN must be numeric"),
});

const verifyPinSchema = z.object({
  userId: z.string(),
  pin: z.string().length(4).regex(/^\d{4}$/),
});

const biometricSchema = z.object({
  enabled: z.boolean(),
});

// Helper to hash PIN
async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

// Helper to verify PIN
async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

// Get user from token
async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  
  try {
    const payload = verifyAccessToken(token);
    if (!payload) return null;
    
    return await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { pin: true },
    });
  } catch {
    return null;
  }
}

// POST /api/auth/pin - Set or update PIN
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  
  // Check if it's a biometric toggle request
  if ("enabled" in body) {
    const parsed = biometricSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const userPin = await prisma.userPin.findUnique({ where: { userId: user.id } });
    if (!userPin) return NextResponse.json({ error: "PIN not set" }, { status: 400 });

    await prisma.userPin.update({
      where: { userId: user.id },
      data: { biometricsEnabled: parsed.data.enabled },
    });

    return NextResponse.json({ 
      success: true, 
      biometricsEnabled: parsed.data.enabled,
      message: parsed.data.enabled ? "Biometrics enabled" : "Biometrics disabled"
    });
  }

  // Set/update PIN
  const parsed = setPinSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const pinHash = await hashPin(parsed.data.pin);

  const userPin = await prisma.userPin.upsert({
    where: { userId: user.id },
    create: { userId: user.id, pinHash },
    update: { pinHash },
  });

  return NextResponse.json({ 
    success: true, 
    hasPin: true,
    biometricsEnabled: userPin.biometricsEnabled,
    message: "PIN set successfully"
  });
}

// GET /api/auth/pin - Get PIN status
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userPin = await prisma.userPin.findUnique({ where: { userId: user.id } });

  return NextResponse.json({
    hasPin: !!userPin,
    biometricsEnabled: userPin?.biometricsEnabled ?? false,
  });
}