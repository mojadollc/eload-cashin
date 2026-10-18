import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import {
  createPayMongoWebhook,
  listPayMongoWebhooks,
  deletePayMongoWebhook,
  enablePayMongoWebhook,
} from "@/providers/paymongo/paymongo.provider";

export const GET = requireAuth(async (_req: NextRequest, payload: JwtPayload) => {
  if (!["SUPER_ADMIN", "ADMIN"].includes(payload.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const webhooks = await listPayMongoWebhooks();
    return NextResponse.json({ webhooks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  if (!["SUPER_ADMIN", "ADMIN"].includes(payload.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { url, action, webhookId } = await req.json();

  try {
    if (action === "enable" && webhookId) {
      const result = await enablePayMongoWebhook(webhookId);
      return NextResponse.json({ webhook: result });
    }
    if (action === "delete" && webhookId) {
      const result = await deletePayMongoWebhook(webhookId);
      return NextResponse.json({ webhook: result });
    }
    const webhookUrl = url || `${process.env.APP_URL}/api/webhooks/paymongo/disbursement`;
    const result = await createPayMongoWebhook(webhookUrl);
    return NextResponse.json({ webhook: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
});
