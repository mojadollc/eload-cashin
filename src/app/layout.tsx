import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/shared/auth-context";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CashIn Tap",
  description: "Your digital wallet for e-load, cash out, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-[#F7F9FA] text-[#17202A]`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
