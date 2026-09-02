"use client";

import { useState } from "react";
import JpAudioButton from "@/components/jp-audio-button";
import { unitAudioUrl, dialogFile, vocabFile } from "@/lib/content/audio-paths";

type ListenTypeExerciseProps = {
  audioRef: string;
  targetKana: string;
  unit: string;
  onResult: (correct: boolean) => void;
};

function parseAudioRef(ref: string): { type: "dialog" | "vocab"; index: number; kind?: "t" | "x" } {
  if (ref.startsWith("d")) {
    return { type: "dialog", index: parseInt(ref.slice(1), 10) };
  }
  if (ref.startsWith("v")) {
    const index = parseInt(ref.slice(1, 3), 10);
    const kind = ref[3] as "t" | "x";
    return { type: "vocab", index, kind };
  }
  return { type: "dialog", index: 0 };
}

export default function ListenTypeExercise({
  audioRef,
  targetKana,
  unit,
  onResult,
}: ListenTypeExerciseProps) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<boolean | null>(null);
  const parsed = parseAudioRef(audioRef);

  function check() {
    const ok = value.trim().toLowerCase() === targetKana.trim().toLowerCase();
    setResult(ok);
    onResult(ok);
  }

  function getAudioSrc() {
    if (parsed.type === "dialog") {
      return unitAudioUrl(unit, dialogFile(parsed.index));
    }
    return unitAudioUrl(unit, vocabFile(parsed.index, parsed.kind!));
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">Dengar lalu ketik kana</p>
      <div className="mt-3 flex justify-center">
        <JpAudioButton src={getAudioSrc()} label={`Audio ${audioRef}`} />
      </div>
      <p className="mt-1.5 text-center text-[11px] text-muted">
        Ketuk 🔊 untuk mendengarkan, lalu ketik kana yang didengar.
      </p>
      {result === null ? (
        <>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            lang="ja"
            aria-label="Jawaban kana"
            className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-lg text-center"
            placeholder="あ"
            autoFocus
          />
          <button
            type="button"
            onClick={check}
            disabled={value.trim().length === 0}
            className="mt-3 w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-40"
          >
            Periksa
          </button>
        </>
      ) : (
        <p className="mt-3 text-sm font-bold text-center">
          {result ? (
            <span className="text-green-600 dark:text-green-400">
              ✓ Benar — {targetKana}
            </span>
          ) : (
            <span className="text-primary">
              ✗ Jawaban benarnya: <span lang="ja">{targetKana}</span>
            </span>
          )}
        </p>
      )}
    </div>
  );
}