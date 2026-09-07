// components/public/Header.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/trucks", label: "Inventory" },
  { href: "/#about", label: "About" },
];

// const CONTACT_EMAIL = "info@primefleetrentals.com";

function isActiveLink(pathname: string, href: string) {
  if (href.includes("#")) return false;
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#141414] bg-white">
      {/* Top strip */}
      <div className="border-b border-[#E4E4E2] bg-[#F7F7F6]">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-1.5 text-xs text-[#6B6E76]">
          <USFlagIcon className="h-3 w-[19px]" />
          <span>Proudly American-owned &amp; operated</span>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center" onClick={closeMenu}>
          <Image
            src="/4954342108944862507_121-removebg-preview.png"
            alt="Prime Fleet Rentals"
            width={666}
            height={375}
            priority
            className="h-14 w-auto"
          />
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <nav className="flex items-center gap-8 text-sm font-semibold uppercase tracking-wide">
            {NAV_LINKS.map((link) => {
              const active = isActiveLink(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative pb-1 transition-colors hover:text-[#D4AF37] ${
                    active ? "text-[#141414]" : "text-[#6B6E76]"
                  }`}
                >
                  {link.label}

                  {active && (
                    <span className="absolute inset-x-0 -bottom-[13px] h-[2px] bg-[#D4AF37]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/contact"
            className="flex items-center gap-2 rounded-md border border-[#141414] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[#141414] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
          >
            <EmailIcon className="h-4 w-4" />
            Contact Us
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-[#141414] text-[#141414] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37] md:hidden"
        >
          <MenuIcon open={menuOpen} />
        </button>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`overflow-hidden border-t border-[#E4E4E2] bg-[#F7F7F6] transition-all duration-300 ease-in-out md:hidden ${
          menuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex flex-col">
            {NAV_LINKS.map((link) => {
              const active = isActiveLink(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className={`border-b border-[#E4E4E2] py-4 text-sm font-semibold uppercase tracking-wide transition-colors hover:text-[#D4AF37] ${
                    active ? "text-[#141414]" : "text-[#6B6E76]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <Link
              href="/contact"
              onClick={closeMenu}
              className="mt-4 flex items-center justify-center gap-2 rounded-md border border-[#141414] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-[#141414] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              <EmailIcon className="h-4 w-4" />
              Contact Us
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

function MenuIcon({
  open,
}: {
  open: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

function USFlagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" className={className} aria-hidden="true">
      <rect width={20} height={14} fill="#B31942" />

      {[1, 3, 5, 7, 9, 11, 13].map((y) => (
        <rect
          key={y}
          x={0}
          y={y}
          width={20}
          height={1}
          fill="#ffffff"
        />
      ))}

      <rect width={8} height={7.5} fill="#0A3161" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x={2} y={4} width={20} height={16} rx={2} />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}