"use client";

import { EVENTS, track } from "@/lib/analytics/events";

const FEEDBACK_URL = "https://github.com/akuh8820/KursusJapan/issues/new/choose";

/**
 * Kartu ajakan umpan balik masa beta (PRD §12: feedback_open).
 * Link keluar ke form issue GitHub — tanpa redirect paksa, sesuai §10.
 */
export default function FeedbackCard() {
  return (
    <section aria-label="Umpan balik" className="mt-6">
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <p className="text-sm font-semibold">Sedang masa beta 🧪</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Menemukan salah ketik, audio aneh, atau punya ide fitur? Ceritakan
          ke kami — semua masukan dipakai untuk perbaikan.
        </p>
        <a
          href={FEEDBACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track(EVENTS.feedbackOpen)}
          className="mt-3 inline-block rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition active:scale-[0.99]"
        >
          Lapor bug / kasih saran →
        </a>
      </div>
    </section>
  );
}
