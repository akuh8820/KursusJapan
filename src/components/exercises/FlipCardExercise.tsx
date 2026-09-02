"use client";

import { useState } from "react";
import JpAudioButton from "@/components/jp-audio-button";
import { unitAudioUrl, vocabFile } from "@/lib/content/audio-paths";

type FlipCardExerciseProps = {
  frontJp: string;
  frontKana: string;
  backId: string;
  unit: string;
  vocabIndex?: number;
};

export default function FlipCardExercise({
  frontJp,
  frontKana,
  backId,
  unit,
  vocabIndex,
}: FlipCardExerciseProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold text-muted">Kartu bolak-balik</p>
      <div
        className="mt-3 rounded-lg border-2 bg-background p-6 text-center transition-all duration-300 cursor-pointer"
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setFlipped((f) => !f)}
        aria-label={flipped ? "Tutup kartu" : "Buka kartu"}
      >
        {!flipped ? (
          <>
            <p lang="ja" className="text-3xl font-bold">
              {frontJp}
            </p>
            <p lang="ja" className="mt-1 text-lg text-muted">
              {frontKana}
            </p>
            <p className="mt-3 text-xs text-muted">Ketuk untuk melihat arti</p>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold">{backId}</p>
            <p className="mt-3 text-xs text-muted">
              Ketuk untuk kembali
            </p>
          </>
        )}
      </div>
      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setFlipped(false)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted"
        >
          Ulangi
        </button>
        <button
          type="button"
          onClick={() => setFlipped(false)}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
        >
          Sudah tahu
        </button>
      </div>
      {vocabIndex !== undefined && (
        <div className="mt-3 flex justify-center">
          <JpAudioButton
            small
            src={unitAudioUrl(unit, vocabFile(vocabIndex, "t"))}
            label={frontJp}
          />
        </div>
      )}
    </div>
  );
}