"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { Lesson } from "@/lib/content/schema";
import { todayJST } from "@/lib/session/streak";
import {
  buildExport,
  getKurasiServerSnapshot,
  getKurasiSnapshot,
  lessonProgress,
  SECTION_KEYS,
  subscribeKurasi,
} from "@/lib/kurasi/review-store";

type UnitMeta = Pick<Lesson, "id" | "unit_no" | "title_id" | "theme">;

export default function KurasiIndex({ lessons }: { lessons: UnitMeta[] }) {
  const state = useSyncExternalStore(
    subscribeKurasi,
    getKurasiSnapshot,
    getKurasiServerSnapshot,
  );

  const totalDone = lessons.filter(
    (l) => lessonProgress(state[l.id]).done === SECTION_KEYS.length,
  ).length;
  const totalProblems = lessons.reduce(
    (acc, l) => acc + (state ? lessonProgress(state[l.id]).problems : 0),
    0,
  );

  function downloadExport() {
    const blob = new Blob([buildExport(getKurasiSnapshot())], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kurasi-${todayJST()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-8">
      <header className="mb-6">
        <p className="text-sm font-medium text-primary">Fasih · Alat internal</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Kurasi konten</h1>
        <p className="mt-1 text-sm text-muted">
          Quality gate manusia (PRD §9.2): cek grammar vs Minna/Genki dan
          naturalitas arti Bahasa Indonesia. Status tersimpan di browser ini —
          ekspor JSON untuk arsip.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              {totalDone}/{lessons.length} pelajaran selesai
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {totalProblems > 0
                ? `⚠️ ${totalProblems} bagian ditandai bermasalah`
                : "Belum ada tanda masalah"}
            </p>
          </div>
          <button
            type="button"
            onClick={downloadExport}
            className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition active:scale-[0.99]"
          >
            Ekspor JSON
          </button>
        </div>
      </section>

      <section aria-label="Daftar unit" className="mt-6">
        <ol className="space-y-2">
          {lessons.map((l) => {
            const p = lessonProgress(state?.[l.id]);
            const done = p.done === SECTION_KEYS.length;
            return (
              <li key={l.id}>
                <Link
                  href={`/kurasi/${l.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition hover:border-primary/40"
                >
                  <span className="w-10 shrink-0 text-center text-xs font-bold text-muted">
                    {String(l.unit_no).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {l.title_id}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {p.done}/{SECTION_KEYS.length} bagian dicek
                      {p.problems > 0 ? ` · ⚠️ ${p.problems} masalah` : ""}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                      done
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted/15 text-muted"
                    }`}
                  >
                    {done ? "Selesai" : p.done > 0 ? "Berjalan" : "Belum"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <p className="mt-6 text-center text-xs text-muted">
        <Link href="/" className="underline underline-offset-2">
          ← Kembali ke dashboard
        </Link>
      </p>
    </main>
  );
}
