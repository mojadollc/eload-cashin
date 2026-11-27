import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/shared/auth-context";
import SwRegister from "@/components/shared/sw-register";
import { LocationTracker } from "@/components/shared/location-tracker";
import { BrandingProvider } from "@/components/shared/branding-provider";
import { prisma } from "@/lib/database/prisma";

export const metadata: Metadata = {
  title: "CashIn Tap",
  description: "Your digital wallet for e-load, cash out, and more.",
  manifest: "/manifest.json",
};
// Note: title is also updated client-side by BrandingProvider when appName is set in DB

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

async function getBranding() {
  try {
    const rows = await prisma.systemSetting.findMany({
      where: { key: { in: ["primaryColor", "secondaryColor", "appName", "faviconUrl"] } },
    });
    const m: Record<string, string> = {};
    for (const r of rows) m[r.key] = r.value;
    return m;
  } catch {
    return {};
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const branding = await getBranding();
  const primary = branding.primaryColor || "#038E80";
  const secondary = branding.secondaryColor || "#0ea5e9";

  function darken(hex: string, amt = 20) {
    const h = hex.replace("#", "");
    const num = parseInt(h, 16);
    const r = Math.max(0, (num >> 16) - amt);
    const g = Math.max(0, ((num >> 8) & 0xff) - amt);
    const b = Math.max(0, (num & 0xff) - amt);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }
  function lighten(hex: string) {
    const h = hex.replace("#", "");
    const num = parseInt(h, 16);
    const r = Math.min(255, Math.round(((num >> 16) & 0xff) * 0.15 + 255 * 0.85));
    const g = Math.min(255, Math.round((((num >> 8) & 0xff)) * 0.15 + 255 * 0.85));
    const b = Math.min(255, Math.round(((num & 0xff)) * 0.15 + 255 * 0.85));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }
  function toRgb(hex: string) {
    const h = hex.replace("#", "");
    const n = parseInt(h, 16);
    return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
  }

  const cssVars = [
    `--brand:${primary}`,
    `--brand-dark:${darken(primary)}`,
    `--brand-light:${lighten(primary)}`,
    `--brand-rgb:${toRgb(primary)}`,
    `--secondary:${secondary}`,
    `--secondary-dark:${darken(secondary)}`,
  ].join(";");

  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content={primary} />
        <link rel="icon" href={branding.faviconUrl || "/favicon.ico"} type="image/x-icon" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <style>{`:root{${cssVars}}`}</style>
      </head>
      <body className="bg-slate-50 text-slate-900">
        <AuthProvider>
          <BrandingProvider />
          <LocationTracker />
          {children}
        </AuthProvider>
        <SwRegister />
      </body>
    </html>
  );
}
