"use client";

import { useState } from "react";
import type { GrammarPoint } from "@/lib/content/schema";

interface GrammarPointWithUnit extends GrammarPoint {
  unitId: string;
  unitNo: number;
  level: string;
  theme: string;
}

interface BunpoClientProps {
  grammarPoints: GrammarPointWithUnit[];
}

export default function BunpoClient({ grammarPoints }: BunpoClientProps) {
  const [selected, setSelected] = useState<GrammarPointWithUnit | null>(null);

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-16 pt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Bunpō (Tata Bahasa)</h1>
        <p className="mt-1 text-sm text-muted">Pola grammar dari semua unit JLPT</p>
      </header>

      {/* List view */}
      {!selected && (
        <section aria-label="Daftar pola grammar" className="space-y-2">
          {grammarPoints.map((gp) => (
            <button
              key={gp.unitId}
              type="button"
              onClick={() => setSelected(gp)}
              className="w-full text-left rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md text-left"
            >
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded-xl bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                  U{String(gp.unitNo).padStart(2, "0")}
                </span>
                <span className="text-xs text-muted">{gp.level}</span>
              </div>
              <p className="mt-2 font-semibold">{gp.pattern}</p>
              <p className="mt-1 text-sm text-muted line-clamp-1">{gp.meaning_id}</p>
              <p className="mt-1 text-xs text-muted">{gp.theme}</p>
            </button>
          ))}
        </section>
      )}

      {/* Detail view */}
      {selected && (
        <article className="space-y-4 animate-fade-in">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground"
          >
            ← Kembali ke daftar
          </button>

          <header className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-xl bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                U{String(selected.unitNo).padStart(2, "0")}
              </span>
              <span className="text-xs text-muted">{selected.level}</span>
            </div>
            <h2 className="text-xl font-bold">{selected.pattern}</h2>
            <p className="mt-2 text-sm text-muted">{selected.meaning_id}</p>
            <p className="mt-3 text-sm font-medium">Pembentukan:</p>
            <p className="mt-1 font-mono text-sm">{selected.formation}</p>
          </header>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="font-semibold">Contoh</h3>
            <div className="mt-3 space-y-3">
              {selected.examples.map((ex, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p lang="ja" className="text-lg font-medium">
                      {ex.jp}
                    </p>
                    <p className="text-sm italic text-muted">{ex.romaji}</p>
                    <p className="text-sm">{ex.id}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </article>
      )}
    </div>
  );
}