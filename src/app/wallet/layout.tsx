"use client";
import { UserLayout } from "@/components/shared/protected-layout";
export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return <UserLayout>{children}</UserLayout>;
}
