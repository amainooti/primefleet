"use client";

import { useEffect, useRef, useState } from "react";

type Brand = { name: string; logo: string };

// Tip: hotlinking truckpaper.com can break at any time. Download the logos into
// /public/brands/ and swap these URLs for "/brands/freightliner.png" etc.
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
 * Never shows a broken-image icon:
 *  - loading -> soft skeleton bar
 *  - loaded  -> the logo (greyscale, colour on hover)
 *  - error   -> the brand name as a clean text wordmark
 */
function BrandLogo({ brand }: { brand: Brand }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [status, setStatus] = useState<Status>("loading");

  // Covers images that finished loading (or failed) before React hydrated.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) setStatus(img.naturalWidth > 0 ? "loaded" : "error");
  }, []);

  return (
    <div className="group relative flex h-14 w-40 items-center justify-center">
      {status === "loading" && (
        <span aria-hidden className="h-3 w-24 animate-pulse rounded-full bg-[#E4E4E2]" />
      )}

      {status === "error" && (
        <span className="text-xl font-bold tracking-tight text-[#6B6E76] transition-colors group-hover:text-[#141414]">
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
          className={`absolute max-h-10 w-auto max-w-[8.5rem] object-contain mix-blend-multiply grayscale transition duration-300 group-hover:grayscale-0 ${
            status === "loaded" ? "opacity-60 group-hover:opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Gold underline that appears on hover */}
      <span
        aria-hidden
        className="absolute bottom-0 h-0.5 w-0 rounded-full bg-[#D4AF37] transition-all duration-300 group-hover:w-8"
      />
    </div>
  );
}

function BrandGroup({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      className="brand-group"
      aria-hidden={hidden || undefined}
      aria-label={hidden ? undefined : "Brands we service"}
    >
      {BRANDS.map((brand) => (
        <li key={brand.name}>
          <BrandLogo brand={brand} />
        </li>
      ))}
    </ul>
  );
}

export function TrustedBrands() {
  return (
    <section className="border-y border-[#E4E4E2] bg-white">
      <style>{`
        .brand-marquee {
          overflow: hidden;
          -webkit-mask-image: linear-gradient(to right, transparent, #000 96px, #000 calc(100% - 96px), transparent);
          mask-image: linear-gradient(to right, transparent, #000 96px, #000 calc(100% - 96px), transparent);
        }
        .brand-track {
          display: flex;
          width: max-content;
        }
        .brand-group {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          gap: 4rem;
          padding-right: 4rem;
          margin: 0;
          list-style: none;
          animation: brand-scroll 45s linear infinite;
          will-change: transform;
        }
        .brand-marquee:hover .brand-group { animation-play-state: paused; }
        @keyframes brand-scroll { to { transform: translateX(-100%); } }

        @media (prefers-reduced-motion: reduce) {
          .brand-marquee { -webkit-mask-image: none; mask-image: none; }
          .brand-track { width: auto; justify-content: center; }
          .brand-group { animation: none; flex-wrap: wrap; justify-content: center; padding-right: 0; row-gap: 1.5rem; }
          .brand-group[aria-hidden="true"] { display: none; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-10 max-w-xl">
          <h2 className="text-2xl font-bold tracking-tight text-[#141414] sm:text-3xl">
            Premium brands we service
          </h2>
          <p className="mt-2 text-base text-[#6B6E76]">
            From Freightliner to Mack, we keep the makes your fleet already runs on.
          </p>
        </div>
      </div>

      <div className="brand-marquee pb-14">
        <div className="brand-track">
          <BrandGroup />
          <BrandGroup hidden />
        </div>
      </div>
    </section>
  );
}