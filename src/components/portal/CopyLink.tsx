"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyLink({ path, label }: { path: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  // Resolve the absolute URL on the client so it matches whatever domain is in use.
  const full = () => `${origin || window.location.origin}${path}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(full());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link:", full());
    }
  }

  return (
    <button
      type="button"
      onMouseEnter={() => !origin && setOrigin(window.location.origin)}
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-md bg-[#141414] px-3 py-1.5 text-xs font-semibold text-[#D4AF37] hover:opacity-90"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied!" : label}
    </button>
  );
}
