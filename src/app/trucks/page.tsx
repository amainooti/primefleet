import { PublicShell } from "@/components/public/PublicShell";
import { TruckCard } from "@/components/public/TruckCard";
import { ContinueBrowsing } from "@/components/public/ContinueBrowsing";

import {
  getFilterOptions,
  getTrucks,
  parseCondition,
  parseStatus,
} from "@/lib/search/trucks";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  category?: string;
  manufacturer?: string;
  condition?: string;
  status?: string;
};


export default async function TrucksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { categories, manufacturers } = await getFilterOptions();

  const trucks = await getTrucks({
    q: params.q,
    category: params.category,
    manufacturer: params.manufacturer,
    condition: parseCondition(params.condition),
    status: parseStatus(params.status),
  });

  return (
    <PublicShell>
    <ContinueBrowsing />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="mt-1 text-[#6B6E76]">
            {trucks.length} {trucks.length === 1 ? "listing" : "listings"}{" "}
            available for rental
          </p>
        </div>

        <form className="mb-8 grid grid-cols-2 gap-3 border border-[#E4E4E2] p-4 sm:grid-cols-3 lg:grid-cols-6">
          <input
            type="text"
            name="q"
            defaultValue={params.q}
            placeholder="Search title, make, stock #"
            className="col-span-2 border border-[#E4E4E2] px-3 py-2 text-sm sm:col-span-3 lg:col-span-2"
          />
          <select
            name="category"
            defaultValue={params.category ?? ""}
            className="border border-[#E4E4E2] px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            name="manufacturer"
            defaultValue={params.manufacturer ?? ""}
            className="border border-[#E4E4E2] px-3 py-2 text-sm"
          >
            <option value="">All manufacturers</option>
            {manufacturers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            name="condition"
            defaultValue={params.condition ?? ""}
            className="border border-[#E4E4E2] px-3 py-2 text-sm"
          >
            <option value="">New or used</option>
            <option value="NEW">New</option>
            <option value="USED">Used</option>
          </select>
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="border border-[#E4E4E2] px-3 py-2 text-sm"
          >
            <option value="">Any status</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="RENTED">Rented</option>
          </select>
          <div className="col-span-2 flex gap-2 sm:col-span-3 lg:col-span-1">
            <button
              type="submit"
              className="w-full bg-[#141414] px-3 py-2 text-sm font-semibold text-[#D4AF37]"
            >
              Apply
            </button>
          </div>
        </form>

        {trucks.length === 0 ? (
          <p className="border border-[#E4E4E2] p-8 text-center text-[#6B6E76]">
            No listings match those filters. Try clearing a filter or
            searching a different term.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trucks.map((truck) => (
              <TruckCard key={truck.id} truck={truck} />
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}