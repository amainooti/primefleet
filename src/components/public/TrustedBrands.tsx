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

/** How long each brand holds its colour before the sweep moves on. */
const STEP_MS = 1700;

type Status = "loading" | "loaded" | "error";

/**
 * One cell of the logo wall.
 *  - loading -> skeleton bar
 *  - loaded  -> logo, greyscale until lit
 *  - error   -> brand name as a text wordmark (never a broken-image icon)
 *
 * `lit` is driven by the parent: either the sequential sweep or the hovered cell.
 */
function BrandCell({
  brand,
  lit,
  onEnter,
  onLeave,
}: {
  brand: Brand;
  lit: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [status, setStatus] = useState<Status>("loading");

  // Covers images that finished (or failed) before React hydrated.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) setStatus(img.naturalWidth > 0 ? "loaded" : "error");
  }, []);

  return (
    <li
      // Pointer events, mouse only: a tap on touch screens must not freeze the sweep.
      onPointerEnter={(e) => e.pointerType === "mouse" && onEnter()}
      onPointerLeave={(e) => e.pointerType === "mouse" && onLeave()}
      className={`relative flex h-32 items-center justify-center transition-colors duration-700 ease-out sm:h-40 ${
        lit ? "bg-[#FAFAF8]" : "bg-white"
      }`}
    >
      {/* Gold rule wipes in from the left when lit, and out to the right when released */}
      <span
        aria-hidden
        className={`absolute left-0 top-0 h-0.5 w-full bg-[#D4AF37] transition-transform duration-700 ease-out ${
          lit ? "origin-left scale-x-100" : "origin-right scale-x-0"
        }`}
      />

      {status === "loading" && (
        <span aria-hidden className="h-3 w-24 animate-pulse rounded-full bg-[#E4E4E2]" />
      )}

      {status === "error" && (
        <span
          className={`text-xl font-bold tracking-tight transition-colors duration-700 ease-out ${
            lit ? "text-[#141414]" : "text-[#6B6E76]"
          }`}
        >
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
          className={`absolute max-h-12 w-auto max-w-[65%] object-contain mix-blend-multiply transition duration-700 ease-out ${
            status !== "loaded"
              ? "opacity-0"
              : lit
                ? "scale-105 opacity-100 grayscale-0"
                : "opacity-70 grayscale"
          }`}
        />
      )}

      {/* Name settles in under the logo while lit */}
      {status !== "error" && (
        <span
          aria-hidden
          className={`absolute bottom-4 text-xs font-medium text-[#6B6E76] transition duration-700 ease-out ${
            lit ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          }`}
        >
          {brand.name}
        </span>
      )}
    </li>
  );
}

export function TrustedBrands() {
  const [active, setActive] = useState(0); // brand currently lit by the sweep
  const [hovered, setHovered] = useState<number | null>(null); // visitor takes control
  const [inView, setInView] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const gridRef = useRef<HTMLUListElement>(null);

  // Respect "reduce motion": no automatic sweep, hover still works.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Only animate while the wall is actually on screen and the tab is in the foreground.
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(el);
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const running = inView && tabVisible && !reduceMotion && hovered === null;

  // The sweep: one brand at a time, in reading order, looping.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % BRANDS.length);
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [running]);

  // With reduced motion and no hover, nothing is lit — the wall stays calm and greyscale.
  const litIndex = hovered ?? (reduceMotion ? -1 : active);

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
          ref={gridRef}
          aria-label="Brands we service"
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#E4E4E2] bg-[#E4E4E2] sm:grid-cols-5"
        >
          {BRANDS.map((brand, i) => (
            <BrandCell
              key={brand.name}
              brand={brand}
              lit={litIndex === i}
              onEnter={() => setHovered(i)}
              onLeave={() => {
                // Hand control back to the sweep, continuing from where the visitor left off.
                setActive(i);
                setHovered(null);
              }}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}