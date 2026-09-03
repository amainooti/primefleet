import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}