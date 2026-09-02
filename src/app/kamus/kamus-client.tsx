"use client";

import { useState, useMemo } from "react";
import JpAudioButton from "@/components/jp-audio-button";
import { unitAudioUrl, vocabFile } from "@/lib/content/audio-paths";
import type { VocabItem, ConjugationEntry } from "@/lib/content/schema";

interface VocabWithUnit extends VocabItem {
  unitId: string;
  unitNo: number;
  level: string;
  theme: string;
}

interface KamusClientProps {
  vocab: VocabWithUnit[];
  conjugations: ConjugationEntry[];
}

export default function KamusClient({ vocab, conjugations }: KamusClientProps) {
  const [query, setQuery] = useState("");
  const [selectedVocab, setSelectedVocab] = useState<VocabWithUnit | null>(null);
  const [showConjugation, setShowConjugation] = useState(false);

  const conjugationMap = useMemo(() => {
    const map = new Map<string, ConjugationEntry>();
    for (const c of conjugations) {
      map.set(c.term, c);
    }
    return map;
  }, [conjugations]);

  const filteredVocab = useMemo(() => {
    if (!query.trim()) return vocab;
    const q = query.trim().toLowerCase();
    return vocab.filter(
      (v) =>
        v.term.toLowerCase().includes(q) ||
        v.kana.toLowerCase().includes(q) ||
        v.romaji.toLowerCase().includes(q) ||
        v.meaning_id.toLowerCase().includes(q)
    );
  }, [vocab, query]);

  const selectedConjugation = selectedVocab ? conjugationMap.get(selectedVocab.term) : null;

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-16 pt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Kamus Jepang</h1>
        <p className="mt-1 text-sm text-muted">{vocab.length} kosakata dari semua unit</p>
      </header>

      {/* Search */}
      <div className="mb-4 relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari kata (kanji/kana/romaji/arti)..."
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Cari kosakata"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            aria-label="Hapus pencarian"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="mb-3 text-xs text-muted">
        {filteredVocab.length} hasil {query ? `dari ${vocab.length} kata` : ""}
      </p>

      {/* Vocab list or detail */}
      {!selectedVocab ? (
        <section aria-label="Daftar kosakata" className="space-y-1 max-h-[60vh] overflow-y-auto">
          {filteredVocab.map((v, idx) => (
            <button
              key={`${v.unitId}-${idx}`}
              type="button"
              onClick={() => {
                setSelectedVocab(v);
                setShowConjugation(false);
              }}
              className="w-full text-left rounded-xl border border-border bg-card p-3 transition hover:border-primary/40 hover:shadow-sm text-left"
            >
              <div className="flex items-center gap-3">
                <p className="text-lg font-bold" lang="ja">
                  {v.term}
                </p>
                {v.term !== v.kana && (
                  <p className="text-sm text-muted">{v.kana}</p>
                )}
                <p className="flex-1 text-sm italic text-muted">{v.romaji}</p>
                <p className="text-sm font-medium">{v.meaning_id}</p>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
                <span className="rounded bg-muted/10 px-1.5 py-0.5">
                  U{String(v.unitNo).padStart(2, "0")}
                </span>
                <span>{v.theme}</span>
              </div>
            </button>
          ))}
          {filteredVocab.length === 0 && (
            <p className="text-center text-muted py-8">Tidak ada kata yang cocok</p>
          )}
        </section>
      ) : (
        <article className="space-y-4 animate-fade-in">
          <button
            type="button"
            onClick={() => setSelectedVocab(null)}
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground"
          >
            ← Kembali ke daftar
          </button>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-3xl font-bold" lang="ja">
                  {selectedVocab.term}
                </p>
                {selectedVocab.term !== selectedVocab.kana && (
                  <p className="mt-1 text-lg text-muted">{selectedVocab.kana}</p>
                )}
                <p className="mt-1 text-sm italic text-muted">{selectedVocab.romaji}</p>
                <p className="mt-2 text-lg font-semibold">{selectedVocab.meaning_id}</p>
              </div>
              <JpAudioButton
                src={unitAudioUrl(selectedVocab.unitId, vocabFile(1, "t"))}
                label={selectedVocab.term}
              />
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-medium">Contoh:</p>
              <p className="mt-1 text-sm" lang="ja">{selectedVocab.example_jp}</p>
              <p className="text-sm italic text-muted">{selectedVocab.example_romaji}</p>
              <p className="text-sm">{selectedVocab.example_id}</p>
              <div className="mt-2">
                <JpAudioButton
                  src={unitAudioUrl(selectedVocab.unitId, vocabFile(1, "x"))}
                  label={`Contoh: ${selectedVocab.example_jp}`}
                  small
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
              <span className="rounded bg-muted/10 px-2 py-0.5 text-[11px] font-medium text-muted">
                U{String(selectedVocab.unitNo).padStart(2, "0")}
              </span>
              <span className="text-xs text-muted">{selectedVocab.theme}</span>
              <span className="text-xs text-muted">{selectedVocab.level}</span>
            </div>
          </section>

          {/* Conjugation panel */}
          {selectedConjugation && (
            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Konjugasi</h3>
                <button
                  type="button"
                  onClick={() => setShowConjugation(!showConjugation)}
                  className="text-sm text-primary hover:underline"
                >
                  {showConjugation ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>

              {showConjugation && (
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(selectedConjugation.forms).map(([key, value]) => (
                    value && (
                      <div key={key} className="col-span-2 flex items-center gap-3 py-1.5">
                        <dt className="shrink-0 w-24 text-muted capitalize">{key}</dt>
                        <dd className="font-mono font-medium" lang="ja">
                          {value}
                        </dd>
                      </div>
                    )
                  ))}
                </dl>
              )}
            </section>
          )}

          {!selectedConjugation && (
            <p className="text-center text-sm text-muted py-4">
              Tidak ada data konjugasi untuk kata ini
            </p>
          )}
        </article>
      )}
    </div>
  );
}