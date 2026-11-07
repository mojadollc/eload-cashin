import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { prisma } from "@/lib/database/prisma";

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const body = await req.json();
  const { latitude, longitude } = body;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  // Update the most recent session for this user with GPS coordinates
  const session = await prisma.session.findFirst({
    where: { userId: payload.userId },
    orderBy: { createdAt: "desc" },
  });

  if (!session) {
    return NextResponse.json({ error: "No active session" }, { status: 404 });
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { 
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    },
  });

  return NextResponse.json({ ok: true });
});