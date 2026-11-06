import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/shared/auth-context";
import SwRegister from "@/components/shared/sw-register";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CashIn Tap",
  description: "Your digital wallet for e-load, cash out, and more.",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#038E80" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${geist.className} bg-[#F7F9FA] text-[#17202A]`}>
        <AuthProvider>{children}</AuthProvider>
        <SwRegister />
      </body>
    </html>
  );
}
