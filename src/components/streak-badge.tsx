"use client";

import { useSyncExternalStore } from "react";
import { getStreak } from "@/lib/session/streak";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export default function StreakBadge() {
  const count = useSyncExternalStore(
    subscribe,
    () => getStreak().count,
    () => 0,
  );

  return (
    <p className="text-2xl font-bold" aria-live="polite">
      {count} hari
    </p>
  );
}
