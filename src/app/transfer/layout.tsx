"use client";
import { UserLayout } from "@/components/shared/protected-layout";
export default function TransferLayout({ children }: { children: React.ReactNode }) {
  return <UserLayout>{children}</UserLayout>;
}
