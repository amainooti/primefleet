"use client";

import { useEffect, useState } from "react";
import { COOKIE_CONSENT_KEY, getClientCookie, setClientCookie } from "@/lib/cookies";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getClientCookie(COOKIE_CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  function respond(value: "accepted" | "declined") {
    setClientCookie(COOKIE_CONSENT_KEY, value, 60 * 60 * 24 * 365);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#141414] px-6 py-5 text-white shadow-[0_-8px_24px_rgba(0,0,0,0.25)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-white/75">
          We use cookies to remember your search and the last truck you
          viewed, so you can pick up where you left off next time.
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => respond("declined")}
            className="border border-white/25 px-4 py-2 text-sm font-semibold text-white/80 hover:border-white/50 hover:text-white"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => respond("accepted")}
            className="bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#141414] hover:bg-[#e9c757]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}