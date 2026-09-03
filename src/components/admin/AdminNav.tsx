"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/actions";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/trucks", label: "Inventory" },
];

function isActiveLink(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[#141414] bg-[#141414] text-white">
      <div className="border-b border-white/10 px-6 py-5">
        <p className="text-sm font-bold uppercase tracking-wide text-[#D4AF37]">
          Prime Fleet
        </p>
        <p className="text-xs text-white/50">Admin</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 text-sm font-semibold uppercase tracking-wide">
        {NAV_LINKS.map((link) => {
          const active = isActiveLink(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-md px-3 py-2 transition-colors ${
                active
                  ? "bg-[#D4AF37] text-[#141414]"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <form action={logout} className="border-t border-white/10 px-3 py-4">
        <button
          type="submit"
          className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold uppercase tracking-wide text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          Sign out
        </button>
      </form>
    </aside>
  );
}