"use client";

import Image from "next/image";
import { useRef } from "react";

type CarouselImage = { src: string; alt: string; caption: string };

// Free-license Unsplash images (verified, not Unsplash+)
const FLEET_IMAGES: CarouselImage[] = [
  { src: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80", alt: "White truck on road during daytime", caption: "On the road, on schedule" },
  { src: "https://images.unsplash.com/photo-1616432043562-3671ea2e5242?auto=format&fit=crop&w=1200&q=80", alt: "White freight truck on road during daytime", caption: "Freight, delivered" },
  { src: "https://images.unsplash.com/photo-1592805144716-feeccccef5ac?auto=format&fit=crop&w=1200&q=80", alt: "Semi truck driving on a highway at dusk", caption: "Built for the long haul" },
  { src: "https://images.unsplash.com/photo-1485575301924-6891ef935dcd?auto=format&fit=crop&w=1200&q=80", alt: "Trailer truck passing on the road", caption: "Every mile, inspected" },
  { src: "https://images.unsplash.com/photo-1720811559395-3ed8d1b16649?auto=format&fit=crop&w=1200&q=80", alt: "Red semi truck driving down a country road", caption: "Ready when you are" },
  { src: "https://images.unsplash.com/photo-1492168732976-2676c584c675?auto=format&fit=crop&w=1200&q=80", alt: "Aerial photography of a freight truck lot", caption: "One fleet, fully managed" },
];

export function TruckCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-card]");
    const width = card ? card.offsetWidth + 16 : 320;
    track.scrollBy({ left: width * direction, behavior: "smooth" });
  }

  return (
    <section className="bg-[#141414] py-16 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">The fleet, on the move</h2>
            <p className="mt-1 text-white/60">A look at the kind of equipment we run.</p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Previous"
              className="border border-white/20 px-3 py-2 text-sm hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Next"
              className="border border-white/20 px-3 py-2 text-sm hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:px-[calc((100%-72rem)/2+1.5rem)]"
      >
        {FLEET_IMAGES.map((image) => (
          <div
            key={image.src}
            data-card
            className="relative aspect-[4/3] w-72 shrink-0 snap-start overflow-hidden sm:w-80"
          >
            <Image src={image.src} alt={image.alt} fill sizes="320px" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-sm font-semibold">{image.caption}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}