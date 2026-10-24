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
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[#141414]">
            Browse by type
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[#6B6E76]">
            Jump straight to the equipment you need.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((category, index) => (
            <Link
              key={category.slug}
              href={`/trucks?category=${category.slug}`}
              className="group flex flex-col items-center text-center"
            >
              {/* Fixed-size icon box: image is contained, never cropped */}
              <div className="relative h-20 w-full max-w-[140px] sm:h-24">
                <Image
                  src={imageForSlug(category.slug, index)}
                  alt={category.name}
                  fill
                  sizes="140px"
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <span className="mt-4 text-sm font-medium leading-tight text-[#141414] sm:text-base">
                {category.name}
              </span>

              {/* Gold underline, grows in on hover */}
              <span className="mt-2 h-0.5 w-full max-w-[120px] origin-center scale-x-0 bg-[#D4AF37] transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
          ))}

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