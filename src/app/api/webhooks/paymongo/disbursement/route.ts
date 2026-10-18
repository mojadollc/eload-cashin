import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { verifyPayMongoWebhook } from "@/providers/paymongo/paymongo.provider";
import { finalizeCashout } from "@/services/cashout/cashout.service";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sigHeader = req.headers.get("paymongo-signature") || "";

  if (!verifyPayMongoWebhook(rawBody, sigHeader, process.env.PAYMONGO_DISBURSEMENT_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventType: string = payload?.data?.attributes?.type || "";
  const disbursement = payload?.data?.attributes?.data;

  if (!disbursement) return NextResponse.json({ ok: true });

  const disbursementId: string = disbursement.id;
  const status: string = disbursement.attributes?.status?.toUpperCase() || "";

  const webhook = await prisma.providerWebhook.create({
    data: {
      provider: "PAYMONGO",
      eventType,
      payload,
      reference: disbursement.attributes?.reference_number || disbursementId,
    },
  });

  if (webhook.processed) return NextResponse.json({ ok: true });

  const statusMap: Record<string, string> = {
    PAID: "COMPLETED",
    FAILED: "FAILED",
    REVERSED: "REVERSED",
    REJECTED: "REJECTED",
  };

  const mappedStatus = statusMap[status];
  if (mappedStatus) await finalizeCashout(disbursementId, mappedStatus);

  await prisma.providerWebhook.update({
    where: { id: webhook.id },
    data: { processed: true, processedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
