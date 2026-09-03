"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

const PLACEHOLDERS = [
  "Search by make...",
  "Search by model...",
  "Search by stock number...",
  "Search trucks and trailers...",
];

export function HeroSearch() {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [typingActive, setTypingActive] = useState(true);

  useEffect(() => {
    if (!typingActive || q) return;

    const current = PLACEHOLDERS[index];

    const timeout = setTimeout(
      () => {
        if (!deleting) {
          setPlaceholder(current.slice(0, charIndex + 1));
          setCharIndex((prev) => prev + 1);

          if (charIndex + 1 === current.length) {
            setDeleting(true);
          }
        } else {
          setPlaceholder(current.slice(0, charIndex - 1));
          setCharIndex((prev) => prev - 1);

          if (charIndex - 1 === 0) {
            setDeleting(false);
            setIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
          }
        }
      },
      deleting ? 40 : charIndex === current.length ? 1800 : 70
    );

    return () => clearTimeout(timeout);
  }, [charIndex, deleting, index, q, typingActive]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Stop typewriter immediately
    setTypingActive(false);

    const params = new URLSearchParams();

    if (q.trim()) {
      params.set("q", q.trim());
    }

    router.push(`/trucks${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <section className="relative overflow-hidden border-b border-[#141414] text-white">
      <video
        src="/HitPaw_Image2Video_20260903111447.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-[#141414]/78" />

      <div className="relative mx-auto max-w-6xl px-6 py-28 sm:py-36">
        <p className="text-sm font-semibold text-[#D4AF37]">
          Prime Fleet Rentals
        </p>

        <h1 className="mt-3 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
          Trucks and trailers, ready to work.
        </h1>

        <p className="mt-4 max-w-md text-white/75">
          One fleet, fully inspected, with real specs and photos on every
          listing — no third-party sellers involved.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex max-w-lg">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={typingActive ? placeholder : "Search inventory"}
            aria-label="Search inventory"
            className="w-full border border-white/20 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/50 backdrop-blur-sm focus:border-[#D4AF37] focus:outline-none"
          />

          <button
            type="submit"
            className="shrink-0 bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#141414] transition-colors hover:bg-[#e9c757]"
          >
            Search
          </button>
        </form>
      </div>
    </section>
  );
}