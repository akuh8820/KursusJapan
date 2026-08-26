"use client";

import { useSyncExternalStore } from "react";
import {
  emptyLessonReview,
  getKurasiServerSnapshot,
  getKurasiSnapshot,
  lessonProgress,
  saveSection,
  SECTION_KEYS,
  SECTION_LABELS,
  subscribeKurasi,
  type SectionKey,
  type Verdict,
} from "@/lib/kurasi/review-store";

export default function ReviewPanel({ lessonId }: { lessonId: string }) {
  const state = useSyncExternalStore(
    subscribeKurasi,
    getKurasiSnapshot,
    getKurasiServerSnapshot,
  );
  const review = state[lessonId] ?? emptyLessonReview();

  function update(
    section: SectionKey,
    patch: { verdict?: Verdict | null; note?: string },
  ) {
    saveSection(lessonId, section, patch);
  }

  const p = lessonProgress(review ?? undefined);
  const done = p.done === SECTION_KEYS.length;

  return (
    <section
      aria-label="Panel kurasi"
      className="mt-6 rounded-2xl border-2 border-primary/30 bg-card p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">Verdict kurasi</h2>
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            done
              ? p.problems > 0
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-muted/15 text-muted"
          }`}
        >
          {done ? (p.problems > 0 ? "Selesai · ada revisi" : "Lolos") : `${p.done}/${SECTION_KEYS.length}`}
        </span>
      </div>

      <ol className="mt-3 space-y-4">
        {SECTION_KEYS.map((key) => {
          const s = review.sections[key];
          return (
            <li key={key}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{SECTION_LABELS[key]}</span>
                <span className="ml-auto flex overflow-hidden rounded-lg border border-border">
                  {(["ok", "problem"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => update(key, { verdict: s.verdict === v ? null : v })}
                      className={`px-3 py-1.5 text-xs font-semibold transition ${
                        s.verdict === v
                          ? v === "ok"
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                            : "bg-red-500/20 text-red-700 dark:text-red-400"
                          : "bg-card text-muted"
                      }`}
                    >
                      {v === "ok" ? "✓ OK" : "⚠ Masalah"}
                    </button>
                  ))}
                </span>
              </div>
              <textarea
                value={s.note}
                onChange={(e) => update(key, { note: e.target.value })}
                placeholder="Catatan revisi (mis. 'arti terlalu kaku', 'pola beda dgn Minna L3')…"
                rows={2}
                className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none placeholder:text-muted/60 focus:border-primary/50"
              />
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-[11px] leading-snug text-muted">
        Tersimpan otomatis di browser ini. Setelah semua bagian dicek, ekspor
        JSON dari halaman daftar untuk arsip keputusan.
      </p>
    </section>
  );
}
