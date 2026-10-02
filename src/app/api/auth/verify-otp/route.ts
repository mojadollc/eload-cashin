import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { z } from "zod";

const schema = z.object({ mobile: z.string(), code: z.string().length(6) });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { mobile, code } = parsed.data;

  const user = await prisma.user.findUnique({ where: { mobile } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const otp = await prisma.otpCode.findFirst({
    where: { userId: user.id, code, type: "MOBILE_VERIFY", used: false, expiresAt: { gt: new Date() } },
  });
  if (!otp) return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });

  await prisma.$transaction([
    prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } }),
    prisma.user.update({ where: { id: user.id }, data: { mobileVerified: true, status: "ACTIVE" } }),
  ]);

  return NextResponse.json({ message: "Mobile verified. Account activated." });
}
