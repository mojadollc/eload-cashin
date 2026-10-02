import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { verifyXenditWebhook } from "@/providers/xendit/xendit.provider";
import { finalizeCashout } from "@/services/cashout/cashout.service";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-callback-token") || "";
  if (!verifyXenditWebhook(token)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await req.json();

  const webhook = await prisma.providerWebhook.create({
    data: { provider: "XENDIT", eventType: payload.status || "DISBURSEMENT", payload, reference: payload.external_id },
  });

  if (webhook.processed) return NextResponse.json({ ok: true });

  const { id: disbursementId, status } = payload;

  // Map Xendit statuses to our statuses
  const statusMap: Record<string, string> = {
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    REVERSED: "REVERSED",
    REJECTED: "REJECTED",
  };

  const mappedStatus = statusMap[status];
  if (mappedStatus) await finalizeCashout(disbursementId, mappedStatus);

  await prisma.providerWebhook.update({ where: { id: webhook.id }, data: { processed: true, processedAt: new Date() } });

  return NextResponse.json({ ok: true });
}
