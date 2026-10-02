import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { getAuth } from "@/lib/firebase/admin";
import { z } from "zod";

const schema = z.object({
  mobile: z.string(),
  firebaseToken: z.string(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { mobile, firebaseToken } = parsed.data;

  // Verify the Firebase ID token
  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(firebaseToken);
  } catch {
    return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 });
  }

  // Normalize both numbers to E.164 for comparison
  const normalizedMobile = mobile.replace(/^0/, "+63");
  if (decoded.phone_number !== normalizedMobile) {
    return NextResponse.json({ error: "Phone number mismatch" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { mobile } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.mobileVerified) return NextResponse.json({ message: "Already verified" });

  await prisma.user.update({
    where: { id: user.id },
    data: { mobileVerified: true, status: "ACTIVE" },
  });

  return NextResponse.json({ message: "Mobile verified. Account activated." });
}
