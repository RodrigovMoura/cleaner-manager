"use client";

import { useEffect } from "react";

/**
 * Lightweight client component to ensure the user's browser timezone
 * is known to the server via a cookie, keeping server-rendered dates
 * and boundaries accurate.
 */
export default function TimezoneDetector() {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        const match = document.cookie.match(/(?:^|;\s*)client_timezone=([^;]*)/);
        const currentCookie = match ? decodeURIComponent(match[1]) : null;
        if (currentCookie !== tz) {
          document.cookie = `client_timezone=${encodeURIComponent(
            tz,
          )}; path=/; max-age=31536000; SameSite=Lax`;
        }
      }
    } catch {
      // Intentionally silent if timezone API not available
    }
  }, []);

  return null;
}
