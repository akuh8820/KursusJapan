"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Lesson, Particle } from "@/lib/content/schema";
import { EVENTS, track } from "@/lib/analytics/events";
import {
  markUnitStarted,
  seedSrsFromVocab,
  setPracticeDone,
  setExamPass,
  getPracticeDone,
  getExamPass,
} from "@/lib/progress/store";
import KanjiCanvas from "@/components/kanji-canvas";

export type UnitOption = { id: string; unit_no: number; title_id: string };

type Phase = "practice" | "exam" | "exam_result" | "complete";

type PracticeArea = "kanji" | "bunpo" | "partikel";

type ExamAnswer = Record<number, number | null>;

interface ReadingQuestion {
  id: string;
  kind: "story" | "gapped_dialog";
  prompt_jp: string;
  prompt_romaji?: string;
  prefix_kana?: string;
  prefix_romaji?: string;
  question_id: string;
  choices: string[];
  answer_index: number;
}

export default function SessionClient({
  lesson,
  units,
  readingQuestions,
  particles,
}: {
  lesson: Lesson;
  units: UnitOption[];
  readingQuestions: ReadingQuestion[];
  particles: Particle[];
}) {
  const [phase, setPhase] = useState<Phase>("practice");
  const [practiceDone, setPracticeDoneState] = useState<Record<string, { kanji: boolean; bunpo: boolean; partikel: boolean }>>({});
  const [examPassed, setExamPassedState] = useState(false);
  const [prevExamPassed, setPrevExamPassed] = useState(true);
  const [examAnswers, setExamAnswers] = useState<ExamAnswer>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examResult, setExamResult] = useState<"pass" | "fail" | null>(null);
  const [loading, setLoading] = useState(true);

  const nextUnit = units.find((u) => u.unit_no === lesson.unit_no + 1);
  const prevUnit = units.find((u) => u.unit_no === lesson.unit_no - 1) ?? null;

  // Load progress from IndexedDB on mount
  useEffect(() => {
    let mounted = true;
    async function loadProgress() {
      const [practice, exam] = await Promise.all([getPracticeDone(), getExamPass()]);
      if (mounted) {
        setPracticeDoneState(practice);
        setExamPassedState(Boolean(exam[lesson.id]));
        setPrevExamPassed(!prevUnit || Boolean(exam[prevUnit.id]));
        setLoading(false);
      }
    }
    loadProgress();
    return () => { mounted = false; };
  }, [lesson.id, prevUnit]);

  // Initialize session: mark unit started, seed SRS, track event
  useEffect(() => {
    async function init() {
      await markUnitStarted(lesson.id);
      await seedSrsFromVocab(lesson.id, lesson.vocab.map((v) => ({ term: v.term, kana: v.kana, meaning_id: v.meaning_id })));
      track(EVENTS.unitStart, { unit: lesson.id, level: lesson.level });
    }
    init();
  }, [lesson]);

  const unitPractice = practiceDone[lesson.id] ?? { kanji: false, bunpo: false, partikel: false };
  const allPracticeDone = unitPractice.kanji && unitPractice.bunpo && unitPractice.partikel;

  const handlePracticeDone = useCallback(async (area: PracticeArea) => {
    await setPracticeDone(lesson.id, area);
    setPracticeDoneState((prev) => ({
      ...prev,
      [lesson.id]: { ...(prev[lesson.id] ?? { kanji: false, bunpo: false, partikel: false }), [area]: true },
    }));
    track(EVENTS.exerciseResult, { unit: lesson.id, type: `practice_${area}`, correct: true });
  }, [lesson.id]);

  const handleExamAnswer = useCallback((qIndex: number, optionIndex: number) => {
    setExamAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  }, []);

  const handleExamSubmit = useCallback(async () => {
    const allAnswered = readingQuestions.every((_, i) => examAnswers[i] !== null);
    if (!allAnswered) return;

    const results = readingQuestions.map((q, i) => examAnswers[i] === q.answer_index);
    const allCorrect = results.every((r) => r);

    track(EVENTS.quizResult, {
      unit: lesson.id,
      correct: results.filter((r) => r).length,
      total: readingQuestions.length,
      passed: allCorrect,
    });

    setExamSubmitted(true);
    setExamResult(allCorrect ? "pass" : "fail");

    if (allCorrect) {
      await setExamPass(lesson.id);
      setExamPassedState(true);
      track(EVENTS.unitComplete, { unit: lesson.id });
    }
  }, [lesson.id, readingQuestions, examAnswers]);

  const handleExamRetry = useCallback(() => {
    setExamAnswers({});
    setExamSubmitted(false);
    setExamResult(null);
  }, []);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4">
        <div className="flex h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted">Memuat progres…</p>
      </main>
    );
  }

  // Lockstep: latihan #n terkunci sampai ujian #(n-1) lolos 100%
  if (!prevExamPassed) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 pb-16 pt-8 text-center">
        <p className="text-5xl" aria-hidden>
          🔒
        </p>
        <h1 className="mt-4 text-2xl font-bold">Unit terkunci</h1>
        <p className="mt-2 text-sm text-muted">
          Selesaikan Ujian #U{String(prevUnit!.unit_no).padStart(2, "0")} dengan 100% benar untuk membuka unit ini.
        </p>
        <div className="mt-8 grid w-full gap-3">
          {prevUnit && (
            <Link
              href={`/sesi/${prevUnit.id}`}
              className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
            >
              Kerjakan Ujian #U{String(prevUnit.unit_no).padStart(2, "0")} →
            </Link>
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

  // If exam already passed, show completion screen
  if (examPassed) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 pb-16 pt-8 text-center">
        <p className="text-5xl" aria-hidden>
          🎉
        </p>
        <h1 className="mt-4 text-2xl font-bold">Unit selesai!</h1>
        <p className="mt-2 text-sm text-muted">
          Ujian #U{String(lesson.unit_no).padStart(2, "0")} lolos 100%. Kamu siap ke unit berikutnya.
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

      {phase === "practice" && (
        <section className="flex-1 space-y-4" aria-label="Latihan ringan">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-semibold">Latihan ringan #U{String(lesson.unit_no).padStart(2, "0")}</h2>
            <p className="mt-1 text-xs text-muted">
              Selesaikan 3 modul di bawah untuk membuka Ujian #{lesson.unit_no}.
            </p>
          </div>

          {/* Kanji Practice */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Kanji #{lesson.unit_no}</h3>
              {unitPractice.kanji && (
                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold">✓ Selesai</span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">
              Latihan menulis setiap karakter. Tandai selesai setelah latihan.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {lesson.writing.map((w) => (
                <div key={`${w.type}-${w.char}`} className="rounded-xl border border-border bg-background p-3 text-center">
                  <p lang="ja" className="text-3xl font-bold">
                    {w.char}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">
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
            <div className="mt-4">
              <KanjiCanvas
                char={lesson.writing[0]?.char ?? "あ"}
                label={`Latihan: ${lesson.writing[0]?.romaji ?? "a"} (${lesson.writing[0]?.type ?? "hiragana"})`}
                showShadow={true}
                height={220}
              />
            </div>
            <button
              type="button"
              onClick={() => handlePracticeDone("kanji")}
              disabled={unitPractice.kanji}
              className="mt-4 w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {unitPractice.kanji ? "✓ Tandai selesai" : "Tandai selesai"}
            </button>
          </div>

          {/* Bunpō Practice */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Bunpō #{lesson.unit_no}</h3>
              {unitPractice.bunpo && (
                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold">✓ Selesai</span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">
              Baca pola tata bahasa dan contohnya. Tandai selesai setelah memahami.
            </p>
            <div className="mt-3 space-y-3">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                <p lang="ja" className="text-lg font-bold text-primary">
                  {lesson.grammar.pattern}
                </p>
                <p className="mt-1 text-sm">{lesson.grammar.meaning_id}</p>
                <p className="mt-1 font-mono text-xs text-muted">{lesson.grammar.formation}</p>
              </div>
              <ol className="space-y-2">
                {lesson.grammar.examples.map((ex, i) => (
                  <li key={i} className="rounded-xl border border-border bg-background p-3">
                    <p lang="ja" className="font-semibold">{ex.jp}</p>
                    <p className="text-xs italic text-muted">{ex.romaji}</p>
                    <p className="mt-1 text-sm">{ex.id}</p>
                  </li>
                ))}
              </ol>
            </div>
            <button
              type="button"
              onClick={() => handlePracticeDone("bunpo")}
              disabled={unitPractice.bunpo}
              className="mt-4 w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {unitPractice.bunpo ? "✓ Tandai selesai" : "Tandai selesai"}
            </button>
          </div>

          {/* Partikel Practice */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Partikel #{lesson.unit_no}</h3>
              {unitPractice.partikel && (
                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold">✓ Selesai</span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">
              {particles.length > 0
                ? "Pelajari partikel yang muncul di unit ini. Latihan interaktif ada di halaman Bunpō."
                : "Tidak ada partikel baru di unit ini."}
            </p>
            {particles.length > 0 ? (
              <div className="mt-3 space-y-2">
                {particles.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border bg-background p-3">
                    <div className="flex items-baseline gap-2">
                      <p lang="ja" className="text-xl font-bold">{p.char}</p>
                      <p className="text-xs italic text-muted">{p.romaji}</p>
                    </div>
                    <p className="mt-1 text-sm font-semibold">{p.function_id}</p>
                    <div className="mt-1 text-xs text-muted">
                      <p lang="ja">{p.example_jp}</p>
                      <p className="italic">{p.example_romaji}</p>
                      <p>{p.example_id}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-border bg-background p-4 text-center text-sm text-muted">
                Tidak ada partikel untuk unit ini.
              </div>
            )}
            <button
              type="button"
              onClick={() => handlePracticeDone("partikel")}
              disabled={unitPractice.partikel}
              className="mt-4 w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {unitPractice.partikel ? "✓ Tandai selesai" : "Tandai selesai"}
            </button>
          </div>

          {/* Proceed to Exam button */}
          <button
            type="button"
            onClick={() => setPhase("exam")}
            disabled={!allPracticeDone}
            className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {allPracticeDone ? "Lanjut ke Ujian #" + lesson.unit_no : "Selesaikan 3 modul di atas dulu"}
          </button>
        </section>
      )}

      {phase === "exam" && (
        <section className="flex-1 space-y-4" aria-label="Ujian">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Ujian #U{String(lesson.unit_no).padStart(2, "0")}</h2>
              <span className="text-xs text-muted">
                Soal {Object.keys(examAnswers).filter((k) => examAnswers[Number(k)] !== null).length} / {readingQuestions.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Jawab semua soal. Butuh 100% benar untuk lolos. Bisa ulang tanpa batas.
            </p>
          </div>

          <div className="space-y-3">
            {readingQuestions.map((q, i) => (
              <ExamQuestionCard
                key={q.id}
                index={i}
                question={q}
                answer={examAnswers[i] ?? null}
                submitted={examSubmitted}
                onAnswer={(opt) => handleExamAnswer(i, opt)}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            {examSubmitted ? (
              examResult === "pass" ? (
                <button
                  type="button"
                  onClick={() => setPhase("complete")}
                  className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
                >
                  Lihat hasil →
                </button>
              ) : (
                <>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Belum lolos — coba lagi
                  </p>
                  <button
                    type="button"
                    onClick={handleExamRetry}
                    className="flex-1 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold"
                  >
                    Ulangi ujian
                  </button>
                </>
              )
            ) : (
              <button
                type="button"
                onClick={handleExamSubmit}
                disabled={readingQuestions.some((_, i) => examAnswers[i] === null)}
                className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-40"
              >
                Kirim jawaban
              </button>
            )}
          </div>
        </section>
      )}

      {phase === "complete" && (
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 pb-16 pt-8 text-center">
          <p className="text-5xl" aria-hidden>
            🎉
          </p>
          <h1 className="mt-4 text-2xl font-bold">Unit selesai!</h1>
          <p className="mt-2 text-sm text-muted">
            Ujian #U{String(lesson.unit_no).padStart(2, "0")} lolos 100%. Kamu siap ke unit berikutnya.
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
      )}
    </main>
  );
}

function ExamQuestionCard({
  index,
  question,
  answer,
  submitted,
  onAnswer,
}: {
  index: number;
  question: ReadingQuestion;
  answer: number | null;
  submitted: boolean;
  onAnswer: (opt: number) => void;
}) {
  const displayPrompt = question.kind === "story"
    ? question.prompt_jp
    : `${question.prefix_kana ?? ""} ___`;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] font-semibold uppercase text-muted">
        Soal {index + 1}
      </p>
      <p className="mt-1 text-sm font-semibold" lang="ja">
        {displayPrompt}
      </p>
      {question.kind === "gapped_dialog" && question.prefix_romaji && (
        <p className="mt-0.5 text-xs text-muted">{question.prefix_romaji} ___</p>
      )}
      <p className="mt-1 text-sm">{question.question_id}</p>
      <div className="mt-2 grid gap-2" role="group" aria-label={`Pilihan soal ${index + 1}`}>
        {question.choices.map((opt, j) => {
          let state: "idle" | "right" | "wrong" | "dim" = "idle";
          if (submitted) {
            if (j === question.answer_index) state = "right";
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