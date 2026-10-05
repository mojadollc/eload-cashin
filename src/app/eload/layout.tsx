"use client";
import { UserLayout } from "@/components/shared/protected-layout";
export default function EloadLayout({ children }: { children: React.ReactNode }) {
  return <UserLayout>{children}</UserLayout>;
}
