"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Exercise, Lesson } from "@/lib/content/schema";
import { EVENTS, track } from "@/lib/analytics/events";
import { markUnitStarted, markQuizPassed, seedSrsFromVocab } from "@/lib/progress/store";
import JpAudioButton from "@/components/jp-audio-button";
import {
  dialogFile,
  unitAudioUrl,
  vocabFile,
} from "@/lib/content/audio-paths";
import FlipCardExercise from "@/components/exercises/FlipCardExercise";
import McVocabExercise from "@/components/exercises/McVocabExercise";
import KanjiCanvas from "@/components/kanji-canvas";

const STEPS = [
  { id: "dialog", label: "Dialog" },
  { id: "grammar", label: "Grammar" },
  { id: "vocab", label: "Kosakata" },
  { id: "writing", label: "Huruf" },
  { id: "exercises", label: "Latihan" },
  { id: "quiz", label: "Kuis" },
] as const;

type StepId = (typeof STEPS)[number]["id"];
type Phase = StepId | "complete";

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

function generateQuizQuestions(lesson: Lesson): Array<{
  prompt: string;
  options: string[];
  answer: number;
}> {
  const questions: Array<{ prompt: string; options: string[]; answer: number }> = [];

  // From vocab: meaning_id as prompt, term as options
  const vocabQuestions = lesson.vocab
    .filter((v) => v.meaning_id && v.term)
    .map((v) => ({
      prompt: v.meaning_id,
      correct: v.term,
    }));

  // From dialog: line.id as prompt, line.jp as options
  const dialogQuestions = lesson.dialog.lines
    .filter((l) => l.id && l.jp)
    .map((l) => ({
      prompt: l.id,
      correct: l.jp,
    }));

  const allSources = [...vocabQuestions, ...dialogQuestions];
  const shuffled = shuffle(allSources);

  for (const source of shuffled) {
    if (questions.length >= 5) break;

    const otherOptions = shuffle(
      allSources.filter((s) => s.correct !== source.correct).map((s) => s.correct)
    ).slice(0, 3);

    const options = shuffle([source.correct, ...otherOptions]);
    const answer = options.indexOf(source.correct);

    questions.push({
      prompt: source.prompt,
      options,
      answer,
    });
  }

  return questions.slice(0, 5);
}

export type UnitOption = { id: string; unit_no: number; title_id: string };

export default function SessionClient({
  lesson,
  units,
}: {
  lesson: Lesson;
  units: UnitOption[];
}) {
  const [phase, setPhase] = useState<Phase>("dialog");
  const [stepIdx, setStepIdx] = useState(0);
  const [exerciseResults, setExerciseResults] = useState<Record<number, boolean>>({});
  const [quizQuestions, setQuizQuestions] = useState<ReturnType<typeof generateQuizQuestions>>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number | null>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [writingPracticeChar, setWritingPracticeChar] = useState<{ char: string; romaji: string; type: string } | null>(null);
  const audioReady = lesson.audio_status === "ready";

  // Initialize session: mark unit started, seed SRS, track event
  useEffect(() => {
    let mounted = true;
    async function init() {
      await markUnitStarted(lesson.id);
      await seedSrsFromVocab(lesson.id, lesson.vocab.map((v) => ({ term: v.term, kana: v.kana, meaning_id: v.meaning_id })));
      track(EVENTS.unitStart, { unit: lesson.id, level: lesson.level });
      if (mounted) {
        setQuizQuestions(generateQuizQuestions(lesson));
      }
    }
    init();
    return () => { mounted = false; };
  }, [lesson]);

  const handleExerciseResult = useCallback((exIndex: number, correct: boolean) => {
    setExerciseResults((prev) => ({ ...prev, [exIndex]: correct }));
    const ex = lesson.exercises[exIndex];
    track(EVENTS.exerciseResult, { unit: lesson.id, type: ex.type, correct });
  }, [lesson.id, lesson.exercises]);

  const handleQuizAnswer = useCallback((qIndex: number, optionIndex: number) => {
    setQuizAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  }, []);

  const handleQuizSubmit = useCallback(async () => {
    const allAnswered = quizQuestions.every((_, i) => quizAnswers[i] !== null);
    if (!allAnswered) return;

    const results = quizQuestions.map((q, i) => quizAnswers[i] === q.answer);
    const allCorrect = results.every((r) => r);

    track(EVENTS.quizResult, {
      unit: lesson.id,
      correct: results.filter((r) => r).length,
      total: quizQuestions.length,
      passed: allCorrect,
    });

    setQuizSubmitted(true);

    if (allCorrect) {
      await markQuizPassed(lesson.id);
      track(EVENTS.unitComplete, { unit: lesson.id });
      setQuizPassed(true);
    }
  }, [lesson.id, quizQuestions, quizAnswers]);

  const handleQuizRetry = useCallback(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
  }, []);

  const nextUnit = units.find((u) => u.unit_no === lesson.unit_no + 1);

  if (phase === "complete") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 pb-16 pt-8 text-center">
        <p className="text-5xl" aria-hidden>
          🎉
        </p>
        <h1 className="mt-4 text-2xl font-bold">Unit selesai!</h1>
        <p className="mt-2 text-sm text-muted">
          Kuis akhiran lolos. Kamu siap ke unit berikutnya.
        </p>
        <div className="mt-8 grid w-full gap-3">
          {nextUnit ? (
            <Link
              href={`/sesi/${nextUnit.id}`}
              className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
            >
              Unit berikutnya → U{String(nextUnit.unit_no).padStart(2, "0")}
            </Link>
          ) : (
            <span className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-muted">
              Tidak ada unit berikutnya
            </span>
          )}
          <Link
            href="/"
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold"
          >
            Kembali ke beranda
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-10 pt-6">
      <header className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {lesson.theme} · U{String(lesson.unit_no).padStart(2, "0")}
          </p>
          <h1 className="font-bold">{lesson.title_id}</h1>
        </div>
        <Link
          href="/"
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold"
        >
          ← Beranda
        </Link>
      </header>

      <nav
        aria-label="Tahap sesi"
        className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1"
      >
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              if (i <= stepIdx || (i === STEPS.length - 1 && phase === "quiz")) {
                setStepIdx(i);
                setPhase(s.id);
              }
            }}
            disabled={i > stepIdx && !(i === STEPS.length - 1 && phase === "quiz")}
            aria-current={i === stepIdx}
            className={`text-xs font-semibold ${
              i === stepIdx
                ? "text-primary underline underline-offset-4"
                : i < stepIdx || (i === STEPS.length - 1 && phase === "quiz")
                  ? "text-foreground"
                  : "text-muted opacity-50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <section className="flex-1" aria-live="polite">
        {phase === "dialog" && (
          <div className="space-y-3">
            <h2 className="font-semibold">{lesson.dialog.title_id}</h2>
            <p className="text-xs text-muted">
              {audioReady
                ? "Ketuk 🔊 di setiap baris untuk mendengarkan pengucapan."
                : "Audio menyusul setelah kurasi TTS — baca dulu dengan romaji."}
            </p>
            <ol className="space-y-3">
              {lesson.dialog.lines.map((line, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                      {line.speaker}
                    </p>
                    {audioReady && (
                      <JpAudioButton
                        small
                        src={unitAudioUrl(lesson.id, dialogFile(i))}
                        label={line.jp}
                      />
                    )}
                  </div>
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

        {phase === "grammar" && (
          <div className="space-y-3">
            <h2 className="font-semibold">Tata bahasa</h2>
            <p lang="ja" className="mt-1 text-xl font-bold text-primary">
              {lesson.grammar.pattern}
            </p>
            <p className="mt-1 text-sm">{lesson.grammar.meaning_id}</p>
            <p className="mt-2 font-mono text-xs">{lesson.grammar.formation}</p>
            <ol className="mt-3 space-y-2">
              {lesson.grammar.examples.map((ex, i) => (
                <li key={i} className="rounded-xl border border-border bg-card p-3">
                  <p lang="ja" className="font-semibold">{ex.jp}</p>
                  <p className="text-xs italic text-muted">{ex.romaji}</p>
                  <p className="mt-1 text-sm">{ex.id}</p>
                  {audioReady && (
                    <div className="mt-2 flex justify-end">
                      <JpAudioButton
                        small
                        src={unitAudioUrl(lesson.id, `g${String(i).padStart(2, "0")}.mp3`)}
                        label={ex.jp}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {phase === "vocab" && (
          <div className="space-y-3">
            <h2 className="font-semibold">Kosakata ({lesson.vocab.length})</h2>
            <ul className="space-y-3">
              {lesson.vocab.map((v, i) => (
                <li key={v.term} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p lang="ja" className="text-xl font-bold">
                      {v.term}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs italic text-muted">
                        {v.romaji}
                      </p>
                      {audioReady && (
                        <JpAudioButton
                          small
                          src={unitAudioUrl(lesson.id, vocabFile(i, "t"))}
                          label={v.term}
                        />
                      )}
                    </div>
                  </div>
                  <p lang="ja" className="text-xs text-muted">
                    {v.kana}
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {v.meaning_id}
                  </p>
                  <div className="mt-2 rounded-lg bg-background p-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <p lang="ja">{v.example_jp}</p>
                      {audioReady && (
                        <JpAudioButton
                          small
                          src={unitAudioUrl(lesson.id, vocabFile(i, "x"))}
                          label={v.example_jp}
                        />
                      )}
                    </div>
                    <p className="italic text-muted">{v.example_romaji}</p>
                    <p className="mt-1">{v.example_id}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {phase === "writing" && (
          <div className="space-y-3">
            {writingPracticeChar ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setWritingPracticeChar(null)}
                  className="text-sm text-primary hover:underline"
                >
                  ← Kembali ke daftar huruf
                </button>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-sm font-semibold text-muted">
                    Latihan menulis: {writingPracticeChar.romaji} · {writingPracticeChar.type}
                  </p>
                  <KanjiCanvas
                    char={writingPracticeChar.char}
                    label={`${writingPracticeChar.romaji} (${writingPracticeChar.type})`}
                    showShadow={true}
                    height={280}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="font-semibold">Huruf ({lesson.writing.length})</h2>
                <p className="text-xs text-muted">
                  Kenali bentuk dan bunyi setiap karakter. Ketuk untuk latihan menulis.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {lesson.writing.map((w) => (
                    <button
                      key={`${w.type}-${w.char}`}
                      type="button"
                      onClick={() => setWritingPracticeChar({ char: w.char, romaji: w.romaji, type: w.type })}
                      className="rounded-xl border border-border bg-card p-4 text-center hover:border-primary/50 hover:bg-primary/5 transition"
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
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {phase === "exercises" && (
          <div className="space-y-3">
            <h2 className="font-semibold">Latihan ({lesson.exercises.length})</h2>
            <p className="text-xs text-muted">
              Kerjakan semua soal. Jawaban dikoreksi langsung.
            </p>
            {lesson.exercises.map((ex, i) => (
              <ExerciseCard
                key={i}
                ex={ex}
                audioReady={audioReady}
                unit={lesson.id}
                vocab={lesson.vocab}
                result={exerciseResults[i]}
                onResult={(correct) => handleExerciseResult(i, correct)}
              />
            ))}
            {lesson.exercises.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setStepIdx(STEPS.length - 1);
                  setPhase("quiz");
                }}
                className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
              >
                Lanjut ke kuis akhiran →
              </button>
            )}
          </div>
        )}

        {phase === "quiz" && (
          <div className="space-y-3">
            <h2 className="font-semibold">Kuis akhiran ({quizQuestions.length} soal)</h2>
            <p className="text-xs text-muted">
              Jawab semua soal dengan benar untuk lolos. Bisa coba ulang tanpa batas.
            </p>
            {quizQuestions.map((q, i) => (
              <QuizQuestionCard
                key={i}
                index={i}
                question={q}
                answer={quizAnswers[i]}
                submitted={quizSubmitted}
                onAnswer={(opt) => handleQuizAnswer(i, opt)}
              />
            ))}
            <div className="mt-4 flex items-center justify-between gap-3">
              {quizSubmitted ? (
                quizPassed ? (
                  <button
                    type="button"
                    onClick={() => setPhase("complete")}
                    className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
                  >
                    Lihat hasil →
                  </button>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-primary">
                      Belum lolos — coba lagi
                    </p>
                    <button
                      type="button"
                      onClick={handleQuizRetry}
                      className="flex-1 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold"
                    >
                      Ulangi kuis
                    </button>
                  </>
                )
              ) : (
                <button
                  type="button"
                  onClick={handleQuizSubmit}
                  disabled={quizQuestions.some((_, i) => quizAnswers[i] === null)}
                  className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-40"
                >
                  Kirim jawaban
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <footer className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            const prev = stepIdx - 1;
            if (prev >= 0) {
              setStepIdx(prev);
              setPhase(STEPS[prev].id);
            }
          }}
          disabled={stepIdx === 0}
          className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold disabled:invisible"
        >
          ← Kembali
        </button>
        {phase !== "quiz" && (
          <button
            type="button"
            onClick={() => {
              const next = stepIdx + 1;
              if (next < STEPS.length) {
                setStepIdx(next);
                setPhase(STEPS[next].id);
              }
            }}
            disabled={stepIdx === STEPS.length - 1}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:invisible"
          >
            Lanjut →
          </button>
        )}
      </footer>
    </main>
  );
}

function ExerciseCard({
  ex,
  audioReady,
  unit,
  vocab,
  result,
  onResult,
}: {
  ex: Exercise;
  audioReady: boolean;
  unit: string;
  vocab: Lesson["vocab"];
  result: boolean | undefined;
  onResult: (correct: boolean) => void;
}) {
  const showResult = result !== undefined;

  if (ex.type === "listen_choose") {
    if (!audioReady) {
      return (
        <div className="rounded-xl border border-border bg-card p-4 opacity-80">
          <p className="text-sm font-semibold">{ex.prompt_id}</p>
          <p className="mt-1 text-xs text-muted">
            ⏳ Menunggu audio TTS — soal ini tidak bisa dikerjakan.
          </p>
        </div>
      );
    }
    return (
      <ListenChooseExercise
        ex={ex}
        unit={unit}
        onResult={onResult}
      />
    );
  }

  if (ex.type === "arrange") {
    return (
      <ArrangeExercise
        tokens={ex.tokens}
        answerJp={ex.answer_jp}
        result={result}
        onResult={onResult}
      />
    );
  }

  if (ex.type === "write_recall") {
    return (
      <WriteRecallExercise
        prompt={ex.prompt_id}
        targetKana={ex.target_kana}
        showResult={showResult}
        result={result}
        onResult={onResult}
      />
    );
  }

  if (ex.type === "flip_card") {
    const vocabIdx = vocab.findIndex((v) => v.term === ex.front_jp);
    return (
      <FlipCardExercise
        frontJp={ex.front_jp}
        frontKana={ex.front_kana}
        backId={ex.back_id}
        unit={unit}
        vocabIndex={vocabIdx >= 0 ? vocabIdx : undefined}
      />
    );
  }

  if (ex.type === "listen_type") {
    return (
      <ListenTypeExerciseWithCanvas
        audioRef={ex.audio_ref}
        targetKana={ex.target_kana}
        unit={unit}
        onResult={onResult}
      />
    );
  }

  if (ex.type === "mc_vocab") {
    return (
      <McVocabExercise
        promptId={ex.prompt_id}
        options={ex.options}
        answer={ex.answer}
        onResult={onResult}
      />
    );
  }

  return null;
}

function ListenChooseExercise({
  ex,
  unit,
  onResult,
}: {
  ex: Extract<Exercise, { type: "listen_choose" }>;
  unit: string;
  onResult: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const correct = picked === ex.answer;

  function pick(j: number) {
    if (picked !== null) return;
    setPicked(j);
    onResult(j === ex.answer);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">{ex.prompt_id}</p>
      <div className="mt-3 flex justify-center">
        <JpAudioButton
          src={unitAudioUrl(unit, dialogFile(ex.line_index))}
          label={`Baris dialog ${ex.line_index + 1}`}
        />
      </div>
      <p className="mt-1.5 text-center text-[11px] text-muted">
        Ketuk 🔊 untuk mendengarkan, lalu pilih artinya.
      </p>
      <div className="mt-3 grid gap-2" role="group" aria-label="Pilihan jawaban">
        {ex.options.map((opt, j) => {
          let state: "idle" | "right" | "wrong" | "dim" = "idle";
          if (picked !== null) {
            if (j === ex.answer) state = "right";
            else if (j === picked) state = "wrong";
            else state = "dim";
          }
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
            : "✗ Belum tepat — dengarkan lagi dan perhatikan jawabannya."}
        </p>
      )}
    </div>
  );
}

function ArrangeExercise({
  tokens,
  answerJp,
  result,
  onResult,
}: {
  tokens: string[];
  answerJp: string;
  result: boolean | undefined;
  onResult: (correct: boolean) => void;
}) {
  const [pool] = useState(() => shuffle(tokens));
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const checkedResult = result ?? (checked ? normalizeJa(picked.map((i) => pool[i]).join("")) === normalizeJa(answerJp) : null);

  const pickedTokens = picked.map((i) => pool[i]);

  function check() {
    const ok = normalizeJa(pickedTokens.join("")) === normalizeJa(answerJp);
    setChecked(true);
    onResult(ok);
  }

  function reset() {
    setPicked([]);
    setChecked(false);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">Susun kalimat yang benar</p>
      <div
        aria-label="Kalimat jawaban"
        className="mt-3 flex min-h-12 flex-wrap content-start gap-1.5 rounded-lg border border-dashed border-border p-2"
        lang="ja"
      >
        {pickedTokens.length === 0 && !checkedResult && (
          <span className="self-center px-1 text-xs text-muted">
            Ketuk kata di bawah…
          </span>
        )}
        {!checkedResult &&
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
        {checkedResult && (
          <span className="self-center px-1 text-sm font-semibold" lang="ja">
            {answerJp}
          </span>
        )}
      </div>
      {!checkedResult && (
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
        {!checkedResult ? (
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
              checkedResult ? "text-green-600 dark:text-green-400" : "text-primary"
            }`}
          >
            {checkedResult
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
  showResult,
  result,
  onResult,
}: {
  prompt: string;
  targetKana: string;
  showResult: boolean;
  result: boolean | undefined;
  onResult: (correct: boolean) => void;
}) {
  const targetChar = targetKana.charAt(0);

  if (showResult && result !== undefined) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">{prompt}</p>
        <p className="mt-3 text-sm font-bold text-center">
          {result ? (
            <span className="text-green-600 dark:text-green-400">
              ✓ Benar — <span lang="ja">{targetKana}</span>
            </span>
          ) : (
            <span className="text-primary">
              ✗ Jawaban benarnya: <span lang="ja">{targetKana}</span>
            </span>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">{prompt}</p>
      <KanjiCanvas
        char={targetChar}
        label={prompt}
        showShadow={true}
        onResult={(correct) => {
          if (correct) onResult(true);
        }}
      />
    </div>
  );
}

function ListenTypeExerciseWithCanvas({
  audioRef,
  targetKana,
  unit,
  onResult,
}: {
  audioRef: string;
  targetKana: string;
  unit: string;
  onResult: (correct: boolean) => void;
}) {
  const [result, setResult] = useState<boolean | null>(null);
  const targetChar = targetKana.charAt(0);

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

  function getAudioSrc() {
    const parsed = parseAudioRef(audioRef);
    if (parsed.type === "dialog") {
      return unitAudioUrl(unit, dialogFile(parsed.index));
    }
    return unitAudioUrl(unit, vocabFile(parsed.index, parsed.kind!));
  }

  if (result !== null) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Dengar lalu tulis kana</p>
        <div className="mt-3 flex justify-center">
          <JpAudioButton src={getAudioSrc()} label={`Audio ${audioRef}`} />
        </div>
        <p className="mt-1.5 text-center text-[11px] text-muted">
          Ketuk 🔊 untuk mendengarkan ulang.
        </p>
        <p className="mt-3 text-sm font-bold text-center">
          {result ? (
            <span className="text-green-600 dark:text-green-400">
              ✓ Benar — <span lang="ja">{targetKana}</span>
            </span>
          ) : (
            <span className="text-primary">
              ✗ Jawaban benarnya: <span lang="ja">{targetKana}</span>
            </span>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">Dengar lalu tulis kana</p>
      <div className="mt-3 flex justify-center">
        <JpAudioButton src={getAudioSrc()} label={`Audio ${audioRef}`} />
      </div>
      <p className="mt-1.5 text-center text-[11px] text-muted">
        Ketuk 🔊 untuk mendengarkan, lalu tulis kana yang didengar.
      </p>
      <KanjiCanvas
        char={targetChar}
        label="Tulis kana yang didengar"
        showShadow={true}
        onResult={(correct) => {
          setResult(correct);
          if (correct) onResult(true);
          else onResult(false);
        }}
      />
    </div>
  );
}

function QuizQuestionCard({
  index,
  question,
  answer,
  submitted,
  onAnswer,
}: {
  index: number;
  question: { prompt: string; options: string[]; answer: number };
  answer: number | null;
  submitted: boolean;
  onAnswer: (opt: number) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] font-semibold uppercase text-muted">
        Soal {index + 1}
      </p>
      <p className="mt-1 text-sm font-semibold">{question.prompt}</p>
      <div className="mt-2 grid gap-2" role="group" aria-label={`Pilihan soal ${index + 1}`}>
        {question.options.map((opt, j) => {
          let state: "idle" | "right" | "wrong" | "dim" = "idle";
          if (submitted) {
            if (j === question.answer) state = "right";
            else if (j === answer) state = "wrong";
            else state = "dim";
          }
          return (
            <button
              key={opt}
              type="button"
              onClick={() => !submitted && onAnswer(j)}
              disabled={submitted}
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
    </div>
  );
}