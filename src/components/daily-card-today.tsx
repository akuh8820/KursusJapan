"use client";

import { useSyncExternalStore } from "react";
import type { DailyCard } from "@/lib/content/schema";
import { todayJST } from "@/lib/date";

const noopSubscribe = () => () => {};

/**
 * Kartu hari ini dipilih di browser per tanggal JST — konten di-bake
 * saat build (static export) jadi tidak pernah basi tanpa rebuild.
 */
export default function DailyCardToday({ cards }: { cards: DailyCard[] }) {
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const today = todayJST();
  const card = cards.find((c) => c.card_date === today) ?? cards[cards.length - 1];

  if (!hydrated || !card) {
    return (
      <section
        aria-label="Kartu Hari Ini"
        className="rounded-2xl border border-border bg-card p-5 shadow-sm"
      >
        <div className="h-6 w-32 animate-pulse rounded-full bg-muted/20" />
        <div className="mt-4 h-9 w-24 animate-pulse rounded-lg bg-muted/20" />
        <div className="mt-3 h-4 w-40 animate-pulse rounded bg-muted/20" />
      </section>
    );
  }

  return (
    <section
      aria-label="Kartu Hari Ini"
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {card.kind === "fakta" ? "Fakta hari ini" : "Kata hari ini"}
        </span>
        <time dateTime={today} className="text-xs text-muted">
          {today}
        </time>
      </div>
      <p lang="ja" className="mt-4 text-3xl font-bold">
        {card.jp}
      </p>
      <p className="mt-1 text-sm italic text-muted">{card.romaji}</p>
      <p className="mt-2 font-semibold">{card.meaning_id}</p>
      {card.note_id && (
        <p className="mt-3 rounded-xl bg-background p-3 text-xs leading-relaxed text-muted">
          💡 {card.note_id}
        </p>
      )}
    </section>
  );
}
