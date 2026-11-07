import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { verifyPayMongoWebhook } from "@/providers/paymongo/paymongo.provider";
import { finalizeCashout } from "@/services/cashout/cashout.service";

const HANDLED_EVENTS = ["disbursement.paid", "disbursement.failed", "disbursement.reversed"];

const STATUS_MAP: Record<string, string> = {
  paid:     "COMPLETED",
  failed:   "FAILED",
  reversed: "REVERSED",
  rejected: "REJECTED",
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sigHeader = req.headers.get("paymongo-signature") || "";

  // Always return 200 — returning 4xx causes PayMongo to disable the webhook
  if (!verifyPayMongoWebhook(rawBody, sigHeader, process.env.PAYMONGO_DISBURSEMENT_WEBHOOK_SECRET!)) {
    return NextResponse.json({ ok: true });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: true });
  }

  const eventType: string = payload?.data?.attributes?.type || "";
  if (!HANDLED_EVENTS.includes(eventType)) return NextResponse.json({ ok: true });

  try {
    const disbursement = payload?.data?.attributes?.data;
    if (!disbursement) return NextResponse.json({ ok: true });

    const disbursementId: string = disbursement.id;
    const rawStatus: string = disbursement.attributes?.status || "";
    const mappedStatus = STATUS_MAP[rawStatus];

    const alreadyProcessed = await prisma.providerWebhook.findFirst({
      where: { reference: disbursementId, processed: true },
    });
    if (alreadyProcessed) return NextResponse.json({ ok: true });

    const webhook = await prisma.providerWebhook.create({
      data: { provider: "PAYMONGO", eventType, payload, reference: disbursementId },
    });

    if (mappedStatus) {
      await finalizeCashout(disbursementId, mappedStatus);
    }

    await prisma.providerWebhook.update({
      where: { id: webhook.id },
      data: { processed: true, processedAt: new Date() },
    });
  } catch (err: any) {
    console.error("[webhook/paymongo/disbursement]", err?.message || err);
  }

  return NextResponse.json({ ok: true });
}
