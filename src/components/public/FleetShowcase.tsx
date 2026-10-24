"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Slide = { src: string; alt: string; title: string; subtitle: string };

const SLIDES: Slide[] = [
  {
    src: "/unsplash/line-haul-ready.jpg",
    alt: "Semi truck driving on a highway at dusk",
    title: "Line-haul ready",
    subtitle: "Tractors and trailers prepped for the long run.",
  },
  {
    src: "/unsplash/on-schedule.jpg",
    alt: "White truck on road during daytime",
    title: "On schedule, every run",
    subtitle: "Dependable equipment that keeps your freight moving.",
  },
  {
    src: "/unsplash/regional-freight.jpg",
    alt: "Trailer truck passing on the road",
    title: "Regional freight",
    subtitle: "Box trucks, flatbeds and vans for local and regional work.",
  },
  {
    src: "/unsplash/built-for-distance.jpg",
    alt: "Red semi truck driving down a country road",
    title: "Built for distance",
    subtitle: "Sleepers and day cabs ready for any lane.",
  },
  {
    src: "/unsplash/one-fleet-fully-managed.jpg",
    alt: "Aerial photography of a freight truck lot",
    title: "One fleet, fully managed",
    subtitle: "Browse the full inventory in one place.",
  },
];

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD = 50;

export function FleetShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set());
  const touchStartX = useRef<number | null>(null);

  const total = SLIDES.length;
  const next = (active + 1) % total;
  const currentLoaded = loaded.has(active);

  const markLoaded = useCallback((index: number) => {
    setLoaded((prev) => {
      if (prev.has(index)) return prev;
      const copy = new Set(prev);
      copy.add(index);
      return copy;
    });
  }, []);

  const go = useCallback(
    (index: number) => setActive(((index % total) + total) % total),
    [total]
  );

  // Autoplay: only runs once the current slide has actually loaded
  useEffect(() => {
    if (paused || !currentLoaded) return;
    const t = setTimeout(() => setActive((i) => (i + 1) % total), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [active, paused, currentLoaded, total]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") go(active - 1);
    if (e.key === "ArrowRight") go(active + 1);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    go(delta < 0 ? active + 1 : active - 1);
  }

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Fleet showcase"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="relative h-[60vh] max-h-[680px] min-h-[420px] w-full overflow-hidden bg-[#141414] outline-none"
    >
      <style>{`
        @keyframes fleet-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes fleet-kenburns { from { transform: scale(1.08); } to { transform: scale(1); } }
        @keyframes fleet-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fleet-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @media (prefers-reduced-motion: reduce) {
          .fleet-kenburns, .fleet-rise, .fleet-shimmer { animation: none !important; }
        }
      `}</style>

      {/* Loading skeleton: visible until the current slide's image is ready */}
      <div
        aria-hidden
        className={`absolute inset-0 overflow-hidden bg-[#1c1c1c] transition-opacity duration-500 ${
          currentLoaded ? "opacity-0" : "opacity-100"
        }`}
      >
        <div
          className="fleet-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
          style={{ animation: "fleet-shimmer 1.4s ease-in-out infinite" }}
        />
      </div>

      {/* Slides: only the active + next are mounted (plus any already loaded) */}
      {SLIDES.map((slide, index) => {
        const shouldMount = index === active || index === next || loaded.has(index);
        if (!shouldMount) return null;
        const isActive = index === active;
        return (
          <Image
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            quality={75}
            onLoad={() => markLoaded(index)}
            className={`object-cover transition-opacity duration-1000 ${
              isActive && loaded.has(index) ? "opacity-100" : "opacity-0"
            } ${isActive && loaded.has(index) ? "fleet-kenburns" : ""}`}
            style={
              isActive && loaded.has(index)
                ? { animation: `fleet-kenburns ${AUTOPLAY_MS + 1500}ms ease-out forwards` }
                : undefined
            }
          />
        );
      })}

      {/* Overlays for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

      {/* Caption */}
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-6 pb-24 sm:pb-28">
        <div
          key={active}
          className="fleet-rise max-w-xl"
          style={{ animation: "fleet-rise 600ms ease-out both" }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
            Prime Fleet
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            {SLIDES[active].title}
          </h2>
          <p className="mt-3 text-base text-white/75 sm:text-lg">
            {SLIDES[active].subtitle}
          </p>
          <Link
            href="/trucks"
            className="mt-6 inline-flex items-center gap-2 bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#141414] transition-colors hover:bg-white"
          >
            View inventory
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

      {/* Bottom bar: progress segments + arrows */}
      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-6xl items-center gap-6 px-6 pb-8">
        <div className="flex flex-1 gap-2">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => go(index)}
              aria-label={`Go to slide ${index + 1}: ${slide.title}`}
              aria-current={index === active}
              className="group relative h-6 flex-1"
            >
              <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 overflow-hidden bg-white/25 transition-all group-hover:h-[3px]">
                <span
                  key={index === active ? `a-${active}-${currentLoaded}` : `i-${index}`}
                  className="block h-full origin-left bg-[#D4AF37]"
                  style={
                    index < active
                      ? { transform: "scaleX(1)" }
                      : index === active && currentLoaded
                      ? {
                          animation: `fleet-progress ${AUTOPLAY_MS}ms linear forwards`,
                          animationPlayState: paused ? "paused" : "running",
                        }
                      : { transform: "scaleX(0)" }
                  }
                />
              </span>
            </button>
          ))}
        </div>

        <p className="hidden font-mono text-sm text-white/70 sm:block">
          <span className="text-[#D4AF37]">{String(active + 1).padStart(2, "0")}</span>
          {" / "}
          {String(total).padStart(2, "0")}
        </p>

        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => go(active - 1)}
            aria-label="Previous slide"
            className="flex h-10 w-10 items-center justify-center border border-white/30 text-white transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => go(active + 1)}
            aria-label="Next slide"
            className="flex h-10 w-10 items-center justify-center border border-white/30 text-white transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}