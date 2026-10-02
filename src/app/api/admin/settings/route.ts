import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ADMIN_ROLES } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const ENV_PATH = path.resolve(process.cwd(), ".env");

const EDITABLE_KEYS = [
  "XENDIT_SECRET_KEY",
  "XENDIT_WEBHOOK_TOKEN",
  "GBITS_API_URL",
  "GBITS_API_KEY",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "APP_URL",
];

function parseEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    result[key] = val;
  }
  return result;
}

function writeEnv(existing: Record<string, string>, updates: Record<string, string>): string {
  const merged = { ...existing, ...updates };
  return Object.entries(merged)
    .map(([k, v]) => `${k}="${v}"`)
    .join("\n") + "\n";
}

function mask(val: string): string {
  if (!val || val === "REPLACE_ME" || val.length < 8) return val;
  return val.slice(0, 4) + "****" + val.slice(-4);
}

export const GET = requireAuth(async (_req: NextRequest, _payload: JwtPayload) => {
  const content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf-8") : "";
  const env = parseEnv(content);
  const result: Record<string, string> = {};
  for (const key of EDITABLE_KEYS) {
    result[key] = mask(env[key] || "");
  }
  return NextResponse.json(result);
}, ADMIN_ROLES);

export const POST = requireAuth(async (req: NextRequest, _payload: JwtPayload) => {
  const body = await req.json();
  const content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf-8") : "";
  const existing = parseEnv(content);

  const updates: Record<string, string> = {};
  for (const key of EDITABLE_KEYS) {
    if (body[key] && !body[key].includes("****")) {
      updates[key] = body[key];
    }
  }

  fs.writeFileSync(ENV_PATH, writeEnv(existing, updates), "utf-8");

  const restart = body.restart !== false;
  if (restart) {
    await new Promise<void>((resolve) => {
      exec("pm2 restart cashin-tap cashin-tap-worker", () => resolve());
    });
  }

  return NextResponse.json({ ok: true, restarted: restart });
}, ADMIN_ROLES);
