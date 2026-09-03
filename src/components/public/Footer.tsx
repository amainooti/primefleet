import Link from "next/link";
import { FacebookIcon, WhatsappIcon } from "./SocialIcons";

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/primefleetrentals", Icon: FacebookIcon },
  { label: "WhatsApp", href: "https://wa.me/18182750595", Icon: WhatsappIcon },

];

export function Footer() {
  return (
    <footer className="border-t border-[#141414] bg-[#141414] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-bold tracking-tight">Prime Fleet Rentals</p>
            <p className="mt-3 max-w-xs text-sm text-white/60">
              A single, owner-managed fleet of trucks and trailers — inspected,
              in stock, and ready to work.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-[#D4AF37]">Company</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li><Link href="/trucks" className="hover:text-white">Inventory</Link></li>
              <li><Link href="/#about" className="hover:text-white">About</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-[#D4AF37]">Contact</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>rentalprimefleet@gmail.com</li>
              <li>(555) 010-2938</li>
              <li>Austin, TX</li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-[#D4AF37]">Follow</p>
            <div className="mt-4 flex gap-3">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center border border-white/20 text-white/70 transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Prime Fleet Rentals. All rights reserved.</p>
          <p>Questions about a listing? Reach out from any truck&apos;s detail page.</p>
        </div>
      </div>
    </footer>
  );
}