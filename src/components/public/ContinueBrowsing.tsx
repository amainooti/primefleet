import { cookies } from "next/headers";
import Link from "next/link";
import { LAST_VISITED_KEY } from "@/lib/cookies";

export async function ContinueBrowsing() {
  const store = await cookies();
  const raw = store.get(LAST_VISITED_KEY)?.value;
  if (!raw) return null;

  let parsed: { href: string; label: string } | null = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed?.href || !parsed.label) return null;

  return (
    <div className="border-b border-[#E4E4E2] bg-[#F7F7F6]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3 text-sm">
        <span className="text-[#6B6E76]">
          Continue where you left off —{" "}
          <span className="font-semibold text-[#141414]">{parsed.label}</span>
        </span>
        <Link href={parsed.href} className="font-semibold text-[#D4AF37] hover:underline">
          Resume →
        </Link>
      </div>
    </div>
  );
}