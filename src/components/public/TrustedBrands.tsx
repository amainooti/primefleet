"use client";

import { useEffect, useRef, useState } from "react";

type Brand = { name: string; logo: string };

const BRANDS: Brand[] = [
  { name: "Freightliner", logo: "/freightliner.png" },
  { name: "International", logo: "/international.png" },
  { name: "Ford", logo: "/ford.png" },
  { name: "Peterbilt", logo: "/peterbilt.png" },
  { name: "Mack", logo: "/mack.png" },
  { name: "Chevrolet", logo: "/chevrolet.png" },
  { name: "Dorsey", logo: "/dorsey.png" },
  { name: "Fontaine", logo: "/fontaine.png" },
  { name: "Utility", logo: "/utility.png" },
  { name: "GMC", logo: "/gmc.png" },
];

type Status = "loading" | "loaded" | "error";

/**
 * One cell of the logo wall.
 *  - loading -> skeleton bar
 *  - loaded  -> logo, greyscale until hovered
 *  - error   -> brand name as a text wordmark (never a broken-image icon)
 */
function BrandCell({ brand }: { brand: Brand }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [status, setStatus] = useState<Status>("loading");

  // Covers images that finished (or failed) before React hydrated.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) setStatus(img.naturalWidth > 0 ? "loaded" : "error");
  }, []);

  return (
    <li className="group relative flex h-32 items-center justify-center bg-white transition-colors duration-300 hover:bg-[#FAFAF8] sm:h-40">
      {/* Gold rule draws across the top edge on hover */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-0.5 w-0 bg-[#D4AF37] transition-all duration-500 ease-out group-hover:w-full"
      />

      {status === "loading" && (
        <span aria-hidden className="h-3 w-24 animate-pulse rounded-full bg-[#E4E4E2]" />
      )}

      {status === "error" && (
        <span className="text-xl font-bold tracking-tight text-[#6B6E76] transition-colors duration-300 group-hover:text-[#141414]">
          {brand.name}
        </span>
      )}

      {status !== "error" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={brand.logo}
          alt={brand.name}
          decoding="async"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={`absolute max-h-12 w-auto max-w-[65%] object-contain mix-blend-multiply grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0 ${
            status === "loaded" ? "opacity-70 group-hover:opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Name slides in under the logo on hover (the wordmark already says it) */}
      {status !== "error" && (
        <span
          aria-hidden
          className="absolute bottom-4 translate-y-1 text-xs font-medium text-[#6B6E76] opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        >
          {brand.name}
        </span>
      )}
    </li>
  );
}

export function TrustedBrands() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-md text-3xl font-bold tracking-tight text-[#141414] sm:text-4xl">
            Brands we service
          </h2>
          <p className="max-w-sm text-base leading-relaxed text-[#6B6E76]">
            {BRANDS.length} manufacturers across tractors, trucks and trailers, serviced by one team.
          </p>
        </div>

        {/* gap-px over a grey background draws the hairline dividers */}
        <ul
          aria-label="Brands we service"
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#E4E4E2] bg-[#E4E4E2] sm:grid-cols-5"
        >
          {BRANDS.map((brand) => (
            <BrandCell key={brand.name} brand={brand} />
          ))}
        </ul>
      </div>
    </section>
  );
}