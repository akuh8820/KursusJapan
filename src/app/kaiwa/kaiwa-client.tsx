"use client";

import { useState } from "react";
import JpAudioButton from "@/components/jp-audio-button";
import { unitAudioUrl, dialogFile } from "@/lib/content/audio-paths";
import type { DialogLine } from "@/lib/content/schema";

interface DialogWithUnit {
  unitId: string;
  unitNo: number;
  level: string;
  theme: string;
  title_id: string;
  lines: DialogLine[];
}

interface KaiwaClientProps {
  dialogs: DialogWithUnit[];
}

export default function KaiwaClient({ dialogs }: KaiwaClientProps) {
  const [selected, setSelected] = useState<DialogWithUnit | null>(null);

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-16 pt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Kaiwa (Percakapan)</h1>
        <p className="mt-1 text-sm text-muted">Dialog sehari-hari dari semua unit</p>
      </header>

      {/* List view */}
      {!selected && (
        <section aria-label="Daftar percakapan" className="space-y-2">
          {dialogs.map((d) => (
            <button
              key={d.unitId}
              type="button"
              onClick={() => setSelected(d)}
              className="w-full text-left rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md text-left"
            >
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded-xl bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                  U{String(d.unitNo).padStart(2, "0")}
                </span>
                <span className="text-xs text-muted">{d.level}</span>
              </div>
              <p className="mt-2 font-semibold">{d.title_id}</p>
              <p className="mt-1 text-sm text-muted">{d.theme} · {d.lines.length} baris</p>
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
            <h2 className="text-xl font-bold">{selected.title_id}</h2>
            <p className="mt-1 text-sm text-muted">{selected.theme}</p>
          </header>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="space-y-3">
              {selected.lines.map((line, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="flex items-center gap-2">
                      <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                        {line.speaker}
                      </span>
                    </p>
                    <p lang="ja" className="mt-1 text-lg font-medium">{line.jp}</p>
                    <p className="text-sm italic text-muted">{line.kana}</p>
                    <p className="text-sm text-muted">{line.romaji}</p>
                    <p className="text-sm">{line.id}</p>
                  </div>
                  <JpAudioButton
                    src={unitAudioUrl(selected.unitId, dialogFile(idx))}
                    label={`${line.speaker}: ${line.jp}`}
                    small
                  />
                </div>
              ))}
            </div>
          </section>
        </article>
      )}
    </div>
  );
}