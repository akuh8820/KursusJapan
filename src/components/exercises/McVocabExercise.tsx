"use client";

import { useState } from "react";

type McVocabExerciseProps = {
  promptId: string;
  options: string[];
  answer: number;
  onResult: (correct: boolean) => void;
};

export default function McVocabExercise({
  promptId,
  options,
  answer,
  onResult,
}: McVocabExerciseProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const correct = picked === answer;

  function pick(j: number) {
    if (picked !== null) return;
    setPicked(j);
    onResult(j === answer);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">{promptId}</p>
      <p className="mt-1.5 text-center text-[11px] text-muted">
        Pilih kata yang sesuai artinya.
      </p>
      <div className="mt-3 grid gap-2" role="group" aria-label="Pilihan jawaban">
        {options.map((opt, j) => {
          const state =
            picked === null
              ? "idle"
              : j === answer
                ? "right"
                : j === picked
                  ? "wrong"
                  : "dim";
          return (
            <button
              key={opt}
              type="button"
              onClick={() => pick(j)}
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
            correct ? "text-green-600 dark:text-green-400" : "text-primary"
          }`}
        >
          {correct
            ? "✓ Benar!"
            : "✗ Belum tepat — perhatikan jawaban yang benar di atas."}
        </p>
      )}
    </div>
  );
}