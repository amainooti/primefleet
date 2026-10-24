import Link from "next/link";
import { CATEGORY_ICONS, TruckIcon, type TruckIconName } from "@/components/public/TruckIcon";

type CategoryLite = { name: string; slug: string };

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Categories that should never appear here (matched by slug, so "Box" -> "box").
const EXCLUDED_SLUGS = new Set(["box"]);

// Same map, keyed by slug, so it works whether you look up by name or slug.
const ICON_BY_SLUG: Record<string, TruckIconName> = Object.fromEntries(
  Object.entries(CATEGORY_ICONS).map(([name, icon]) => [slugify(name), icon]),
);

// No random fallback: a category without an icon gets a neutral placeholder,
// so one image is never reused for a different category.
function iconFor(category: CategoryLite): TruckIconName | null {
  return CATEGORY_ICONS[category.name] ?? ICON_BY_SLUG[category.slug] ?? ICON_BY_SLUG[slugify(category.name)] ?? null;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function BrowseByType({ categories: allCategories }: { categories: CategoryLite[] }) {
  const categories = allCategories.filter(
    (c) => !EXCLUDED_SLUGS.has(c.slug) && !EXCLUDED_SLUGS.has(slugify(c.name)),
  );
  if (categories.length === 0) return null;

  return (
    <section className="border-b border-[#E4E4E2] bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[#141414]">
            Browse by type
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[#6B6E76]">
            Jump straight to the equipment you need.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((category) => {
            const icon = iconFor(category);
            return (
              <Link
                key={category.slug}
                href={`/trucks?category=${category.slug}`}
                className="group flex flex-col items-center text-center"
              >
                {/* Fixed-size icon box: the icon is contained, never cropped.
                    Wheels spin while the card is hovered (the Link has `group`). */}
                <div className="relative h-20 w-full max-w-[140px] sm:h-24">
                  {icon ? (
                    <TruckIcon
                      name={icon}
                      title={category.name}
                      className="h-full w-full text-[#141414] transition-colors duration-300 group-hover:text-[#D4AF37]"
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-[#E4E4E2] text-2xl font-bold text-[#C9CBD0]"
                    >
                      {initials(category.name)}
                    </div>
                  )}
                </div>

                <span className="mt-4 text-sm font-medium leading-tight text-[#141414] sm:text-base">
                  {category.name}
                </span>

                {/* Gold underline, grows in on hover */}
                <span className="mt-2 h-0.5 w-full max-w-[120px] origin-center scale-x-0 bg-[#D4AF37] transition-transform duration-200 group-hover:scale-x-100" />
              </Link>
            );
          })}

          <Link
            href="/trucks"
            className="group flex flex-col items-center text-center"
          >
            <div className="flex h-20 w-full max-w-[140px] items-center justify-center sm:h-24">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#141414] text-3xl font-light leading-none text-[#141414] transition-colors group-hover:border-[#D4AF37] group-hover:text-[#D4AF37]">
                +
              </span>
            </div>
            <span className="mt-4 text-sm font-medium leading-tight text-[#141414] sm:text-base">
              View all inventory
            </span>
            <span className="mt-2 h-0.5 w-full max-w-[120px] origin-center scale-x-0 bg-[#D4AF37] transition-transform duration-200 group-hover:scale-x-100" />
          </Link>
        </div>
      </div>
    </section>
  );
}