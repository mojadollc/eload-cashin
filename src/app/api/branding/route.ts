import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

export const dynamic = "force-dynamic";

const BRAND_KEYS = ["primaryColor", "secondaryColor", "logoUrl", "faviconUrl", "appName"];

export async function GET() {
  const entries = await prisma.systemSetting.findMany({
    where: { key: { in: BRAND_KEYS } },
  });
  const result: Record<string, string> = {};
  for (const e of entries) result[e.key] = e.value;
  return NextResponse.json(result);
}
