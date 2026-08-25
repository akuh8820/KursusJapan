"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Memuat PostHog hanya bila key tersedia; selain itu no-op total
 * (nol script pihak ketiga sampai konfigurasi diisi).
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host =
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
    if (!key) return;

    let cancelled = false;
    import("posthog-js").then(({ default: posthog }) => {
      if (cancelled) return;
      posthog.init(key, {
        api_host: host,
        capture_pageview: true,
        persistence: "localStorage+cookie",
      });
      (window as unknown as { posthog?: typeof posthog }).posthog = posthog;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}
