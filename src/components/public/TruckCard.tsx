"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "./StatusBadge";

type TruckCardData = {
  slug: string;
  stockNumber: string;
  title: string;
  condition: string;
  status: string;
  rateDisplay: string;
  location: string | null;
  category: { name: string };
  images: { url: string; alt: string | null }[];
};

export function TruckCard({ truck }: { truck: TruckCardData }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = truck.images[0];
  const showImage = Boolean(image) && !imageFailed;

  return (
    <Link
      href={`/trucks/${truck.slug}`}
      className="block border border-[#E4E4E2] transition-colors hover:border-[#141414]"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-[#E4E4E2]">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.alt ?? truck.title}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm text-[#6B6E76]">No image available</span>
        )}
        <span className="absolute left-2 top-2 bg-white/90 px-2 py-0.5 font-mono text-xs text-[#6B6E76]">
          {truck.stockNumber}
        </span>
      </div>
      <div className="space-y-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug">{truck.title}</h3>
          <StatusBadge status={truck.status} />
        </div>
        <p className="text-sm text-[#6B6E76]">{truck.category.name}</p>
        <p className="text-sm text-[#6B6E76]">
          {truck.condition === "NEW" ? "New" : "Used"}
          {truck.location ? `, ${truck.location}` : ""}
        </p>
        <p className="pt-1 font-semibold">{truck.rateDisplay}</p>
      </div>
    </Link>
  );
}