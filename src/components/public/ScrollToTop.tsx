// src/components/public/ScrollToTop.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "-400px 0px 0px 0px", threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Invisible marker near the top of the page; once it scrolls out of view, show the button */}
      <div ref={sentinelRef} className="pointer-events-none absolute left-0 top-0 h-px w-px" />
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center border border-[#E4E4E2] bg-[#141414] text-[#D4AF37] shadow-lg transition-all duration-300 hover:bg-[#1f1f1f] ${
          visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </svg>
      </button>
    </>
  );
}