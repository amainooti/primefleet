"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Slide = { src: string; alt: string; title: string };

const SLIDES: Slide[] = [
  { src: "https://images.unsplash.com/photo-1592805144716-feeccccef5ac?auto=format&fit=crop&w=2000&q=80", alt: "Semi truck driving on a highway at dusk", title: "Line-haul ready" },
  { src: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=2000&q=80", alt: "White truck on road during daytime", title: "On schedule, every run" },
  { src: "https://images.unsplash.com/photo-1485575301924-6891ef935dcd?auto=format&fit=crop&w=2000&q=80", alt: "Trailer truck passing on the road", title: "Regional freight" },
  { src: "https://images.unsplash.com/photo-1720811559395-3ed8d1b16649?auto=format&fit=crop&w=2000&q=80", alt: "Red semi truck driving down a country road", title: "Built for distance" },
  { src: "https://images.unsplash.com/photo-1492168732976-2676c584c675?auto=format&fit=crop&w=2000&q=80", alt: "Aerial photography of a freight truck lot", title: "One fleet, fully managed" },
];

const AUTOPLAY_MS = 5000;

export function FleetShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (paused) return;
    timeoutRef.current = setTimeout(() => {
      setActive((i) => (i + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [active, paused]);

  function go(index: number) {
    setActive((index + SLIDES.length) % SLIDES.length);
  }

  return (
    <section
      className="relative aspect-[4/3] overflow-hidden bg-[#141414] sm:aspect-[16/8]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((slide, index) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={index === 0}
          sizes="100vw"
          className={`object-cover transition-opacity duration-700 ${
            index === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {/* progress bars, double as slide nav */}
      <div className="absolute inset-x-6 top-6 flex gap-2 sm:inset-x-10 sm:top-10">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => go(index)}
            aria-label={`Go to slide ${index + 1}`}
            className="h-[2px] flex-1 overflow-hidden bg-white/25"
          >
            <span
              key={active}
              className="block h-full bg-[#D4AF37]"
              style={
                index < active
                  ? { width: "100%" }
                  : index === active
                  ? {
                      animationName: "fill-progress",
                      animationDuration: `${AUTOPLAY_MS}ms`,
                      animationTimingFunction: "linear",
                      animationFillMode: "forwards",
                      animationPlayState: paused ? "paused" : "running",
                    }
                  : { width: "0%" }
              }
            />
          </button>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 px-6 py-8 sm:px-10 sm:py-10">
        <div>
          <p className="font-mono text-sm text-[#D4AF37]">
            {String(active + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            {SLIDES[active].title}
          </h2>
        </div>

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