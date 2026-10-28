import type { Metadata } from "next";
import type { ReactNode } from "react";

// Portals are private-by-link: keep them out of search engines.
export const metadata: Metadata = {
  title: "Client Portal | Prime Fleet",
  robots: { index: false, follow: false },
  referrer: "no-referrer", // keep the secret manage key out of Referer headers
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
