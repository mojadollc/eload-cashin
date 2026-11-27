"use client";
import { useEffect } from "react";

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function darken(hex: string, amt = 20) {
  const h = hex.replace("#", "");
  const num = parseInt(h, 16);
  const r = Math.max(0, (num >> 16) - amt);
  const g = Math.max(0, ((num >> 8) & 0xff) - amt);
  const b = Math.max(0, (num & 0xff) - amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function lighten(hex: string) {
  // produce a very light tint for --brand-light
  const h = hex.replace("#", "");
  const num = parseInt(h, 16);
  const r = Math.min(255, Math.round(((num >> 16) & 0xff) * 0.15 + 255 * 0.85));
  const g = Math.min(255, Math.round((((num >> 8) & 0xff)) * 0.15 + 255 * 0.85));
  const b = Math.min(255, Math.round(((num & 0xff)) * 0.15 + 255 * 0.85));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function BrandingProvider() {
  useEffect(() => {
    fetch("/api/branding")
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        const root = document.documentElement;

        if (data.primaryColor) {
          root.style.setProperty("--brand", data.primaryColor);
          root.style.setProperty("--brand-dark", darken(data.primaryColor));
          root.style.setProperty("--brand-light", lighten(data.primaryColor));
          root.style.setProperty("--brand-rgb", hexToRgb(data.primaryColor));
          // Update theme-color meta
          const meta = document.querySelector('meta[name="theme-color"]');
          if (meta) meta.setAttribute("content", data.primaryColor);
        }

        if (data.secondaryColor) {
          root.style.setProperty("--secondary", data.secondaryColor);
          root.style.setProperty("--secondary-dark", darken(data.secondaryColor));
        }

        if (data.faviconUrl) {
          let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = data.faviconUrl;
        }

        if (data.appName) {
          document.title = data.appName;
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
