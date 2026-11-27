import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ADMIN_ROLES } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { prisma } from "@/lib/database/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const BRAND_KEYS = ["primaryColor", "secondaryColor", "logoUrl", "faviconUrl", "appName"];

async function setSetting(key: string, value: string) {
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export const GET = requireAuth(async (_req: NextRequest, _payload: JwtPayload) => {
  const entries = await prisma.systemSetting.findMany({
    where: { key: { in: BRAND_KEYS } },
  });
  const result: Record<string, string> = {};
  for (const e of entries) result[e.key] = e.value;
  return NextResponse.json(result);
}, ADMIN_ROLES);

export const POST = requireAuth(async (req: NextRequest, _payload: JwtPayload) => {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const entries = Object.fromEntries(form.entries());
    const type = (entries["type"] as string) ?? "";
    const file = entries["file"] instanceof Blob ? (entries["file"] as File) : null;
    if (!file || !type) return NextResponse.json({ error: "Missing file or type" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const filename = type === "favicon" ? `favicon.${ext}` : `logo.${ext}`;
    const brandDir = path.join(process.cwd(), "public", "brand");
    if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(brandDir, filename), buffer);

    // Also overwrite public/favicon.ico so browser tab picks it up
    if (type === "favicon") {
      fs.writeFileSync(path.join(process.cwd(), "public", "favicon.ico"), buffer);
    }

    const url = `/brand/${filename}?t=${Date.now()}`;
    await setSetting(type === "favicon" ? "faviconUrl" : "logoUrl", url);
    return NextResponse.json({ ok: true, url });
  }

  const body = await req.json();
  for (const key of ["primaryColor", "secondaryColor", "appName"]) {
    if (body[key] !== undefined) await setSetting(key, body[key]);
  }
  return NextResponse.json({ ok: true });
}, ADMIN_ROLES);
