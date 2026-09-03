"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AdminNav } from "./AdminNav";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#F7F7F6]">
      <AdminNav />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}