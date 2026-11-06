import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth, ADMIN_ROLES } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";

// GET /api/admin/paymongo/webhooks?limit=10&provider=PAYMONGO
export const GET = requireAuth(async (req: NextRequest, _payload: JwtPayload) => {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const eventType = searchParams.get("eventType") || undefined;
  const processed = searchParams.get("processed");

  const webhooks = await prisma.providerWebhook.findMany({
    where: {
      provider: "PAYMONGO",
      ...(eventType ? { eventType } : {}),
      ...(processed !== null && processed !== undefined ? { processed: processed === "1" } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      eventType: true,
      reference: true,
      processed: true,
      processedAt: true,
      error: true,
      createdAt: true,
      payload: true,
    },
  });

  return NextResponse.json({ total: webhooks.length, webhooks });
}, ADMIN_ROLES);
