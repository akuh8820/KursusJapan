"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSrsDue, reviewSrsCard } from "@/lib/progress/store";
import { EVENTS, track } from "@/lib/analytics/events";
import type { SrsCard } from "@/lib/progress/store";

export default function UlasanPage() {
  const [dueCards, setDueCards] = useState<SrsCard[]>([]);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const due = await getSrsDue(50);
      setDueCards(due);
      setHydrated(true);
    })();
  }, []);

  async function handleReview(cardId: string, correct: boolean) {
    try {
      await reviewSrsCard(cardId, correct);
      track(EVENTS.srsReview, { cardId, correct });
      setDueCards((prev) => prev.filter((c) => c.id !== cardId));
      setReviewing(null);
      setShowAnswer(false);
    } catch (e) {
      console.error("Gagal review SRS:", e);
    }
  }

  if (!hydrated) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Ulasan kosakata</h1>
          <p className="mt-1 text-sm text-muted">Memuat kartu yang jatuh tempo…</p>
        </header>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-sm animate-pulse">
              <div className="h-8 w-3/4 rounded bg-muted/20" />
              <div className="mt-3 h-6 w-1/2 rounded bg-muted/20" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (dueCards.length === 0) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Ulasan kosakata</h1>
          <p className="mt-1 text-sm text-muted">Tidak ada kartu yang jatuh tempo. Bagus! 🎉</p>
        </header>
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-lg font-medium">Semua tertib</p>
          <p className="mt-1 text-sm text-muted">Kembali nanti untuk ulasan berikutnya.</p>
          <Link href="/" className="mt-4 inline-block text-primary underline">
            ← Kembali ke dashboard
          </Link>
        </div>
      </main>
    );
  }

  const currentCard = dueCards[0];

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Ulasan kosakata</h1>
        <p className="mt-1 text-sm text-muted">{dueCards.length} kartu jatuh tempo</p>
      </header>

      {reviewing ? (
        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="text-center">
            <p className="text-xs text-muted mb-2">Kartu {dueCards.indexOf(currentCard) + 1} dari {dueCards.length}</p>
            <p lang="ja" className="text-4xl font-bold mb-2">
              {currentCard.term}
            </p>
            <p className="text-sm text-muted mb-1">{currentCard.kana}</p>
            <p className="text-lg font-medium mb-4">{currentCard.meaning}</p>

            {!showAnswer ? (
              <button
                type="button"
                onClick={() => setShowAnswer(true)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium transition hover:border-primary/40"
              >
                Lihat jawaban
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted">Apakah jawabanmu benar?</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleReview(currentCard.id, true)}
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.98]"
                  >
                    Benar ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview(currentCard.id, false)}
                    className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.98]"
                  >
                    Salah ✗
                  </button>
                </div>
              </div>
            )}
          </div>
        </article>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm text-center">
          <p className="font-medium">Siap untuk ulasan?</p>
          <p className="mt-1 text-sm text-muted">{dueCards.length} kartu menunggu</p>
          <button
            type="button"
            onClick={() => setReviewing(currentCard.id)}
            className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition active:scale-[0.98]"
          >
            Mulai ulasan
          </button>
        </div>
      )}

      <footer className="mt-8 text-center text-xs text-muted">
        <Link href="/" className="underline hover:text-foreground">← Kembali ke dashboard</Link>
      </footer>
    </main>
  );
}