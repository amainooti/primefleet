import Image from "next/image";
import Link from "next/link";

type CategoryLite = { name: string; slug: string };

const CATEGORY_IMAGES: Record<string, string> = {
  flatbed: "/category-images/flatbed.png",
  box: "/category-images/box.png",
  van: "/category-images/van.png",
  reefer: "/category-images/reefer.png",
  dump: "/category-images/dump.png",
  sleeper: "/category-images/sleeper.png",
  daycab: "/category-images/daycab.png",
  tank: "/category-images/tank.png",
  lowboy: "/category-images/lowboy.png",
};

const FALLBACK_POOL = Object.values(CATEGORY_IMAGES);

function imageForSlug(slug: string, index: number) {
  const s = slug.toLowerCase();
  const key = Object.keys(CATEGORY_IMAGES).find((k) => s.includes(k));
  return key ? CATEGORY_IMAGES[key] : FALLBACK_POOL[index % FALLBACK_POOL.length];
}

export function BrowseByType({ categories }: { categories: CategoryLite[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="border-b border-[#E4E4E2] bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold tracking-tight">Browse by type</h2>
        <p className="mt-2 max-w-md text-[#6B6E76]">
          Jump straight to the equipment you need.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category, index) => (
            <Link
              key={category.slug}
              href={`/trucks?category=${category.slug}`}
              className="group relative aspect-[4/3] overflow-hidden"
            >
              <Image
                src={imageForSlug(category.slug, index)}
                alt={category.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <span className="absolute bottom-0 left-0 right-0 p-4 text-sm font-semibold text-white">
                {category.name}
              </span>
            </Link>
          ))}
          <Link
            href="/trucks"
            className="group relative flex aspect-[4/3] flex-col items-center justify-center gap-2 border border-[#E4E4E2] bg-[#F7F7F6] text-center transition-colors hover:border-[#D4AF37] hover:bg-[#141414]"
          >
            <span className="text-2xl font-semibold text-[#141414] group-hover:text-[#D4AF37]">
              +
            </span>
            <span className="text-sm font-semibold text-[#141414] group-hover:text-white">
              View all inventory
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}