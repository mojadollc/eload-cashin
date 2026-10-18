import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { ok } from "@/lib/mobile/response";

// No auth required — called on app launch before login
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientVersion = searchParams.get("version") ?? "0.0.0";
  const platform = searchParams.get("platform") ?? "android"; // ios | android

  const keys = [
    `app_min_version_${platform}`,
    `app_latest_version_${platform}`,
    `app_store_url_${platform}`,
    "app_maintenance_mode",
    "app_maintenance_message",
  ];

  const settings = await prisma.systemSetting.findMany({ where: { key: { in: keys } } });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const minVersion = map[`app_min_version_${platform}`] ?? "1.0.0";
  const latestVersion = map[`app_latest_version_${platform}`] ?? "1.0.0";
  const storeUrl = map[`app_store_url_${platform}`] ?? "";
  const maintenanceMode = map["app_maintenance_mode"] === "true";
  const maintenanceMessage = map["app_maintenance_message"] ?? "We are under maintenance. Please try again later.";

  const forceUpdate = compareVersions(clientVersion, minVersion) < 0;
  const updateAvailable = compareVersions(clientVersion, latestVersion) < 0;

  return ok({
    forceUpdate,
    updateAvailable,
    minVersion,
    latestVersion,
    storeUrl,
    maintenanceMode,
    maintenanceMessage: maintenanceMode ? maintenanceMessage : null,
  });
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
