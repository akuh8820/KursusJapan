"use client";

import { useState } from "react";
import type { ReadingItem } from "@/lib/content/schema";

type ReadingItemWithTheme = ReadingItem & { theme: string };

interface ReadingClientProps {
  items: ReadingItemWithTheme[];
}

export default function ReadingClient({ items }: ReadingClientProps) {
  const [selected, setSelected] = useState<ReadingItemWithTheme | null>(null);
  const [picked, setPicked] = useState<number | null>(null);

  function open(item: ReadingItemWithTheme) {
    setSelected(item);
    setPicked(null);
  }

  function close() {
    setSelected(null);
    setPicked(null);
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-16 pt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Latihan Baca</h1>
        <p className="mt-1 text-sm text-muted">
          {items.length} soal cerita & percakapan — latihan bebas, tidak mengunci ujian
        </p>
      </header>

      {!selected ? (
        <section aria-label="Daftar soal baca" className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => open(item)}
              className="w-full text-left rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md text-left"
            >
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded-xl bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                  {item.kind === "story" ? "Cerita" : "Percakapan"}
                </span>
                <span className="text-xs text-muted">{item.theme}</span>
              </div>
              <p className="mt-2 text-sm font-medium line-clamp-2" lang="ja">
                {item.prompt_jp}
              </p>
              <p className="mt-1 text-xs text-muted line-clamp-1">{item.question_id}</p>
            </button>
          ))}
        </section>
      ) : (
        <article className="space-y-4 animate-fade-in">
          <button
            type="button"
            onClick={close}
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground"
          >
            ← Kembali ke daftar
          </button>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-xl bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                {selected.kind === "story" ? "Cerita" : "Percakapan"}
              </span>
              <span className="text-xs text-muted">{selected.theme}</span>
            </div>
            <p lang="ja" className="text-lg font-medium leading-relaxed">
              {selected.prompt_jp}
            </p>
            {selected.kind === "story" ? (
              <>
                <p className="mt-2 text-sm italic text-muted">{selected.prompt_romaji}</p>
                <p className="mt-2 text-sm">{selected.prompt_id}</p>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm italic text-muted">{selected.prefix_romaji}</p>
                <p className="mt-2 text-sm text-muted">
                  Isi bagian yang kosong (___ ) dengan pilihan yang tepat.
                </p>
              </>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold">{selected.question_id}</p>
            <div className="mt-3 grid gap-2" role="group" aria-label="Pilihan jawaban">
              {selected.choices.map((opt, j) => {
                let state: "idle" | "right" | "wrong" | "dim" = "idle";
                if (picked !== null) {
                  if (j === selected.answer_index) state = "right";
                  else if (j === picked) state = "wrong";
                  else state = "dim";
                }
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => picked === null && setPicked(j)}
                    disabled={picked !== null}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                      state === "right"
                        ? "border-emerald-500/60 bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-400"
                        : state === "wrong"
                          ? "border-red-500/60 bg-red-500/10 text-red-600 dark:text-red-400"
                          : state === "dim"
                            ? "border-border text-muted opacity-50"
                            : "border-border bg-background active:scale-[0.99]"
                    }`}
                  >
                    {String.fromCharCode(65 + j)}. {opt}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <p
                aria-live="polite"
                className={`mt-3 text-sm font-bold ${
                  picked === selected.answer_index
                    ? "text-green-600 dark:text-green-400"
                    : "text-primary"
                }`}
              >
                {picked === selected.answer_index
                  ? "✓ Benar!"
                  : `✗ Belum tepat — jawaban benarnya: ${selected.choices[selected.answer_index]}`}
              </p>
            )}
          </section>

          {picked !== null && (
            <button
              type="button"
              onClick={close}
              className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
            >
              Soal Berikutnya →
            </button>
          )}
        </article>
      )}
    </div>
  );
}