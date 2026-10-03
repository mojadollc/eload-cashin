import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

export async function POST(req: NextRequest) {
  const { mobile } = await req.json();
  if (!mobile) return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { mobile } });
  if (!user) return NextResponse.json({ error: "No account found with this mobile number" }, { status: 404 });
  if (!user.mobileVerified) return NextResponse.json({ error: "Account not verified" }, { status: 400 });

  return NextResponse.json({ message: "OTP will be sent" });
}
