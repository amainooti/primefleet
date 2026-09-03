"use client";

import { useEffect } from "react";
import {
  COOKIE_CONSENT_KEY,
  LAST_VISITED_KEY,
  getClientCookie,
  setClientCookie,
} from "@/lib/cookies";

export function VisitTracker({ href, label }: { href: string; label: string }) {
  useEffect(() => {
    if (getClientCookie(COOKIE_CONSENT_KEY) !== "accepted") return;
    setClientCookie(LAST_VISITED_KEY, JSON.stringify({ href, label }), 60 * 60 * 24 * 30);
  }, [href, label]);

  return null;
}