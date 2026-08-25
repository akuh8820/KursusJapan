"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Exercise, Lesson } from "@/lib/content/schema";
import { EVENTS, track } from "@/lib/analytics/events";
import { recordCycleComplete } from "@/lib/session/streak";

const FOCUS_MS = 20 * 60_000;
const BREAK_MS = 5 * 60_000;

type Phase = "idle" | "focus" | "break" | "complete";

export type UnitOption = { id: string; unit_no: number; title_id: string };

const STEPS = ["Tujuan", "Dialog", "Kosakata", "Huruf", "Latihan", "Rangkum"];

function fmt(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function normalizeJa(s: string): string {
  return s.replace(/[。、．，！？\s]/g, "");
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SessionClient({
  lesson,
  units,
}: {
  lesson: Lesson;
  units: UnitOption[];
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [pausesUsed, setPausesUsed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [streakCount, setStreakCount] = useState(0);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const startedAtRef = useRef(0);

  const running = phase === "focus" || phase === "break";

  const finishCycle = useCallback(() => {
    setPhase("complete");
    setEndsAt(null);
    setStreakCount(recordCycleComplete().count);
    track(EVENTS.cycleComplete, {
      unit: lesson.id,
      level: lesson.level,
      focus_min: FOCUS_MS / 60_000,
      break_min: BREAK_MS / 60_000,
    });
  }, [lesson.id, lesson.level]);

  useEffect(() => {
    if (!running || pausedAt !== null) return;
    const iv = setInterval(() => {
      const t = Date.now();
      if (endsAt !== null && t >= endsAt) {
        if (phase === "focus") {
          setPhase("break");
          setStepIdx(0);
          setEndsAt(t + BREAK_MS);
          setNow(t + BREAK_MS);
        } else {
          finishCycle();
        }
      } else {
        setNow(t);
      }
    }, 250);
    return () => clearInterval(iv);
  }, [running, pausedAt, endsAt, phase, finishCycle]);

  function startFocus() {
    startedAtRef.current = Date.now();
    setNow(Date.now());
    track(EVENTS.sessionStart, { unit: lesson.id, level: lesson.level });
    setStepIdx(0);
    setPausesUsed(false);
    setPhase("focus");
    setEndsAt(Date.now() + FOCUS_MS);
  }

  function pause() {
    if (pausesUsed) return;
    setPausedAt(Date.now());
    setPausesUsed(true);
  }

  function resume() {
    if (pausedAt === null) return;
    const shift = Date.now() - pausedAt;
    setEndsAt((e) => (e === null ? e : e + shift));
    setPausedAt(null);
    setNow(Date.now());
  }

  function abandon() {
    track(EVENTS.cycleAbandoned, {
      unit: lesson.id,
      phase,
      elapsed_s: Math.round((Date.now() - startedAtRef.current) / 1000),
    });
    router.push("/");
  }

  const totalMs = phase === "focus" ? FOCUS_MS : BREAK_MS;
  const referenceNow = pausedAt ?? now;
  const remainingMs =
    endsAt === null ? totalMs : Math.max(0, endsAt - referenceNow);
  const progress =
    endsAt === null ? 0 : Math.min(1, Math.max(0, 1 - remainingMs / totalMs));

  if (phase === "idle") {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-8">
        <header className="mb-6">
          <Link href="/" className="text-sm text-muted hover:underline">
            ← Dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">
            Sesi hari ini · {lesson.theme}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Siklus 20 menit fokus + 5 menit rehat (PRD §6).
          </p>
        </header>

        <label className="block text-xs font-semibold text-muted">
          Pilih unit
          <select
            value={lesson.id}
            onChange={(e) => router.push(`/sesi/${e.target.value}`)}
            className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-normal text-foreground"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {String(u.unit_no).padStart(2, "0")} · {u.title_id}
              </option>
            ))}
          </select>
        </label>

        <section className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">{lesson.title_id}</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed">
            {lesson.objectives_id.map((o) => (
              <li key={o} className="flex gap-2">
                <span aria-hidden className="text-primary">
                  ◆
                </span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-xl bg-background p-3 text-xs text-muted">
            Pola inti:{" "}
            <span lang="ja" className="font-semibold text-foreground">
              {lesson.grammar.pattern}
            </span>{" "}
            — {lesson.grammar.meaning_id}
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-dashed border-border p-4 text-xs leading-relaxed text-muted">
          Aturan siklus:
          <ol className="mt-1 list-decimal space-y-1 pl-4">
            <li>Fokus tanpa iklan &amp; notifikasi selama 20 menit.</li>
            <li>Jeda maksimal 1× — lebih dari itu siklus batal.</li>
            <li>Rehat 5 menit harus penuh agar streak menyala 🔥</li>
          </ol>
        </section>

        <button
          type="button"
          onClick={startFocus}
          className="mt-6 w-full rounded-2xl bg-primary px-4 py-4 text-base font-bold text-primary-foreground shadow-sm transition active:scale-[0.99]"
        >
          Mulai fokus 20 menit ▶
        </button>
      </main>
    );
  }

  if (phase === "complete") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 pb-16 pt-8 text-center">
        <p className="text-5xl" aria-hidden>
          🎉
        </p>
        <h1 className="mt-4 text-2xl font-bold">Siklus 20+5 selesai!</h1>
        <p className="mt-2 text-sm text-muted">
          Streak kamu sekarang{" "}
          <strong className="text-foreground">{streakCount} hari</strong> —
          sampai jumpa besok di unit berikutnya.
        </p>
        <div className="mt-8 grid w-full gap-3">
          <Link
            href="/"
            className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
          >
            Kembali ke dashboard
          </Link>
          <Link
            href={`/sesi/${lesson.id}`}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold"
          >
            Ulangi unit ini
          </Link>
        </div>
      </main>
    );
  }

  const isFocus = phase === "focus";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-10 pt-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {isFocus ? "Fokus" : "Rehat"}
          </p>
          <p
            role="timer"
            aria-label={
              isFocus ? "Sisa waktu fokus" : "Sisa waktu rehat"
            }
            className="font-mono text-4xl font-bold tabular-nums"
          >
            {fmt(remainingMs)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFocus && (
            <button
              type="button"
              onClick={pausedAt === null ? pause : resume}
              disabled={!pausedAt && pausesUsed}
              title={
                pausesUsed && pausedAt === null
                  ? "Jeda sudah dipakai — siklus batal jika dijeda lagi"
                  : undefined
              }
              className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pausedAt !== null ? "Lanjut ▶" : "Jeda ⏸"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            aria-label="Batalkan sesi"
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold"
          >
            ✕
          </button>
        </div>
      </div>

      <div
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted/20"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {isFocus ? (
        <>
          <nav
            aria-label="Tahap fokus"
            className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1"
          >
            {STEPS.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => setStepIdx(i)}
                aria-current={i === stepIdx}
                className={`text-xs font-semibold ${
                  i === stepIdx
                    ? "text-primary underline underline-offset-4"
                    : "text-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </nav>

          <section className="mt-3 flex-1" aria-live="polite">
            {stepIdx === 0 && (
              <div className="space-y-3">
                <h2 className="font-semibold">Tujuan unit ini</h2>
                <ul className="space-y-2 text-sm leading-relaxed">
                  {lesson.objectives_id.map((o) => (
                    <li key={o} className="flex gap-2">
                      <span aria-hidden className="text-primary">
                        ◆
                      </span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl border border-border bg-card p-4 text-sm">
                  <p className="text-xs font-semibold text-muted">
                    Pola tata bahasa
                  </p>
                  <p lang="ja" className="mt-1 text-lg font-bold">
                    {lesson.grammar.pattern}
                  </p>
                  <p className="mt-1 text-muted">
                    {lesson.grammar.meaning_id}
                  </p>
                  <p className="mt-2 font-mono text-xs">
                    {lesson.grammar.formation}
                  </p>
                </div>
              </div>
            )}

            {stepIdx === 1 && (
              <div className="space-y-3">
                <h2 className="font-semibold">{lesson.dialog.title_id}</h2>
                <p className="text-xs text-muted">
                  Audio menyusul setelah kurasi TTS — baca dulu dengan
                  romaji.
                </p>
                <ol className="space-y-3">
                  {lesson.dialog.lines.map((line, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                        {line.speaker}
                      </p>
                      <p lang="ja" className="mt-1 text-lg font-semibold">
                        {line.jp}
                      </p>
                      <p lang="ja" className="text-xs text-muted">
                        {line.kana}
                      </p>
                      <p className="mt-1 text-xs italic text-muted">
                        {line.romaji}
                      </p>
                      <p className="mt-2 text-sm">{line.id}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {stepIdx === 2 && (
              <div className="space-y-3">
                <h2 className="font-semibold">
                  Kosakata ({lesson.vocab.length})
                </h2>
                <ul className="space-y-3">
                  {lesson.vocab.map((v) => (
                    <li
                      key={v.term}
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <p lang="ja" className="text-xl font-bold">
                          {v.term}
                        </p>
                        <p className="text-xs italic text-muted">
                          {v.romaji}
                        </p>
                      </div>
                      <p lang="ja" className="text-xs text-muted">
                        {v.kana}
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {v.meaning_id}
                      </p>
                      <div className="mt-2 rounded-lg bg-background p-2 text-xs">
                        <p lang="ja">{v.example_jp}</p>
                        <p className="italic text-muted">{v.example_romaji}</p>
                        <p className="mt-1">{v.example_id}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {stepIdx === 3 && (
              <div className="space-y-3">
                <h2 className="font-semibold">
                  Huruf ({lesson.writing.length})
                </h2>
                <p className="text-xs text-muted">
                  Trace goresan interaktif (dataset KanjiVG) hadir di fase
                  berikutnya — kenali bentuknya dulu.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {lesson.writing.map((w) => (
                    <div
                      key={`${w.type}-${w.char}`}
                      className="rounded-xl border border-border bg-card p-4 text-center"
                    >
                      <p lang="ja" className="text-4xl font-bold">
                        {w.char}
                      </p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">
                        {w.romaji} · {w.type}
                      </p>
                      {w.meaning_id && (
                        <p className="mt-1 text-xs text-muted">
                          {w.meaning_id}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stepIdx === 4 && (
              <div className="space-y-3">
                <h2 className="font-semibold">Latihan singkat</h2>
                {lesson.exercises.map((ex, i) => (
                  <ExerciseCard
                    key={i}
                    ex={ex}
                    writingChars={lesson.writing.map((w) => w.char)}
                    onResult={(correct) =>
                      track(EVENTS.exerciseResult, {
                        exercise: ex.type,
                        correct,
                        unit: lesson.id,
                      })
                    }
                  />
                ))}
              </div>
            )}

            {stepIdx === 5 && (
              <div className="space-y-3 text-sm leading-relaxed">
                <h2 className="font-semibold">Rangkuman</h2>
                <p>
                  Kamu sudah mengenal{" "}
                  <strong>{lesson.vocab.length} kosakata</strong>,{" "}
                  <strong>{lesson.writing.length} huruf</strong>, dan pola{" "}
                  <span lang="ja" className="font-semibold">
                    {lesson.grammar.pattern}
                  </span>
                  .
                </p>
                <p className="text-muted">
                  Tetap di layar ini sampai timer habis — fase rehat 5 menit
                  mulai otomatis dan wajib penuh agar streak bertambah.
                </p>
              </div>
            )}
          </section>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
              disabled={stepIdx === 0}
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold disabled:invisible"
            >
              ← Kembali
            </button>
            <button
              type="button"
              onClick={() =>
                setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))
              }
              disabled={stepIdx === STEPS.length - 1}
              className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:invisible"
            >
              Lanjut →
            </button>
          </div>
        </>
      ) : (
        <section className="mt-6 flex-1 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold">Rehat — kamu sudah pantas 🍵</h2>
            <p className="mt-1 text-sm text-muted">
              Berdiri, minum air, alihkan pandangan. Rehat penuh 5 menit
              menyalakan streak hari ini.
            </p>
          </div>

          <BreakReview vocab={lesson.vocab} />

          {/* Slot iklan hanya boleh tampil di fase rehat (PRD §10) */}
          <aside className="rounded-xl border border-dashed border-border p-4 text-center text-[11px] text-muted">
            Slot iklan non-intrusif — hanya di fase rehat.
          </aside>
        </section>
      )}

      {confirmCancel && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Batalkan sesi?"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
        >
          <div className="w-full max-w-xs rounded-2xl bg-card p-5 text-center shadow-lg">
            <p className="font-semibold">Batalkan sesi?</p>
            <p className="mt-1 text-sm text-muted">
              Siklus belum selesai — streak tidak bertambah.
            </p>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              >
                Lanjutkan belajar
              </button>
              <button
                type="button"
                onClick={abandon}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted"
              >
                Ya, batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function BreakReview({
  vocab,
}: {
  vocab: Lesson["vocab"];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold">
          Review ringan: kosakata barusan ({vocab.length})
        </span>
        <span aria-hidden className="text-muted">
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <ul className="mt-3 divide-y divide-border">
          {vocab.map((v) => (
            <li key={v.term} className="flex items-baseline justify-between py-2">
              <span lang="ja" className="font-semibold">
                {v.term}
              </span>
              <span className="text-sm text-muted">{v.meaning_id}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ExerciseCard({
  ex,
  writingChars,
  onResult,
}: {
  ex: Exercise;
  writingChars: string[];
  onResult: (correct: boolean) => void;
}) {
  if (ex.type === "listen_choose") {
    return (
      <div className="rounded-xl border border-border bg-card p-4 opacity-80">
        <p className="text-sm font-semibold">{ex.prompt_id}</p>
        <p className="mt-1 text-xs text-muted">
          ⏳ Menunggu audio TTS — bagian ini dilewati dulu.
        </p>
        <div className="mt-3 grid gap-2">
          {ex.options.map((opt) => (
            <div
              key={opt}
              className="rounded-lg border border-border px-3 py-2 text-sm text-muted"
            >
              {opt}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (ex.type === "arrange") {
    return <ArrangeExercise tokens={ex.tokens} answerJp={ex.answer_jp} onResult={onResult} />;
  }
  return (
    <WriteRecallExercise
      prompt={ex.prompt_id}
      targetKana={ex.target_kana}
      choices={writingChars}
      onResult={onResult}
    />
  );
}

function ArrangeExercise({
  tokens,
  answerJp,
  onResult,
}: {
  tokens: string[];
  answerJp: string;
  onResult: (correct: boolean) => void;
}) {
  const [pool] = useState(() => shuffle(tokens));
  const [picked, setPicked] = useState<number[]>([]);
  const [result, setResult] = useState<boolean | null>(null);

  const pickedTokens = picked.map((i) => pool[i]);

  function check() {
    const ok = normalizeJa(pickedTokens.join("")) === normalizeJa(answerJp);
    setResult(ok);
    onResult(ok);
  }

  function reset() {
    setPicked([]);
    setResult(null);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">Susun kalimat yang benar</p>
      <div
        aria-label="Kalimat jawaban"
        className="mt-3 flex min-h-12 flex-wrap content-start gap-1.5 rounded-lg border border-dashed border-border p-2"
        lang="ja"
      >
        {pickedTokens.length === 0 && (
          <span className="self-center px-1 text-xs text-muted">
            Ketuk kata di bawah…
          </span>
        )}
        {!result &&
          pickedTokens.map((t, idx) => (
            <button
              key={`${t}-${idx}`}
              type="button"
              onClick={() => setPicked((p) => p.filter((_, i) => i !== idx))}
              className="rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary"
            >
              {t}
            </button>
          ))}
        {result !== null && (
          <span className="self-center px-1 text-sm font-semibold" lang="ja">
            {answerJp}
          </span>
        )}
      </div>
      {result === null && (
        <div className="mt-2 flex flex-wrap gap-1.5" lang="ja">
          {pool.map((t, idx) =>
            picked.includes(idx) ? null : (
              <button
                key={`${t}-${idx}`}
                type="button"
                onClick={() => setPicked((p) => [...p, idx])}
                className="rounded-lg border border-border px-2.5 py-1 text-sm font-semibold"
              >
                {t}
              </button>
            ),
          )}
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        {result === null ? (
          <>
            <button
              type="button"
              onClick={check}
              disabled={picked.length !== pool.length}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-40"
            >
              Periksa
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={picked.length === 0}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted disabled:opacity-40"
            >
              Ulang
            </button>
          </>
        ) : (
          <p
            className={`text-sm font-bold ${
              result ? "text-green-600 dark:text-green-400" : "text-primary"
            }`}
          >
            {result
              ? "✓ Benar!"
              : "✗ Belum tepat — perhatikan susunan di atas."}
          </p>
        )}
      </div>
    </div>
  );
}

function WriteRecallExercise({
  prompt,
  targetKana,
  choices,
  onResult,
}: {
  prompt: string;
  targetKana: string;
  choices: string[];
  onResult: (correct: boolean) => void;
}) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<boolean | null>(null);

  function check() {
    const ok = value.trim() === targetKana;
    setResult(ok);
    onResult(ok);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">{prompt}</p>
      {result === null ? (
        <>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            lang="ja"
            aria-label="Jawaban huruf Jepang"
            className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-lg"
            placeholder="あ"
          />
          <div className="mt-2 flex flex-wrap gap-1.5" lang="ja">
            {choices.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setValue((v) => v + c)}
                className="rounded-lg border border-border px-2.5 py-1 text-base font-semibold"
              >
                {c}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={check}
            disabled={value.trim().length === 0}
            className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-40"
          >
            Periksa
          </button>
        </>
      ) : (
        <p className="mt-3 text-sm font-bold">
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
