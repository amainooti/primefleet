import Link from "next/link";
import { PublicShell } from "@/components/public/PublicShell";
import { TruckCard } from "@/components/public/TruckCard";
import { HeroSearch } from "@/components/public/HeroSearch";
import { BrowseByType } from "@/components/public/BrowseByType";
import { AboutSection } from "@/components/public/AboutSection";
import { FleetShowcase } from "@/components/public/FleetShowcase";
import { TrustedBrands } from "@/components/public/TrustedBrands";
import { getTrucks, getFilterOptions } from "@/lib/search/trucks";
import { FAQSection } from "@/components/public/FAQSection";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [available, { categories }] = await Promise.all([
    getTrucks({ status: "AVAILABLE" }),
    getFilterOptions(),
  ]);
  const featured = available.slice(0, 3);

  return (
    <PublicShell>
      <HeroSearch />
      <BrowseByType categories={categories} />
      <AboutSection />
      <FleetShowcase />
      <TrustedBrands />

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Available now</h2>
          <Link href="/trucks" className="text-sm font-semibold text-[#6B6E76] hover:text-[#141414]">
            See all listings
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="text-[#6B6E76]">Check back soon — new listings are added regularly.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((truck) => (
              <TruckCard key={truck.id} truck={truck} />
            ))}
          </div>
        )}
      </section>
      <FAQSection />
    </PublicShell>
  );
}