"use client";

import { useEffect, useState } from "react";
import { EVENTS, track } from "@/lib/analytics/events";
import { getSetting, setSetting } from "@/lib/progress/store";

function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("gojapan-theme") as "dark" | "light" | null;
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await getSetting<"dark" | "light">("theme");
      if (!cancelled && saved) {
        setTheme(saved);
        document.documentElement.classList.toggle("dark", saved === "dark");
      }
      if (!cancelled) {
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    await setSetting("theme", next);
    track(EVENTS.themeToggle, { theme: next });
  }

  if (!ready) {
    return (
      <button
        type="button"
        aria-label="Memuat tema…"
        className="rounded-xl border border-border bg-card p-2"
        disabled
      >
        <span aria-hidden="true">⏳</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
      className="rounded-xl border border-border bg-card p-2 transition hover:border-primary/40 active:scale-[0.98]"
    >
      <span aria-hidden="true" className="text-xl">
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
    </button>
  );
}