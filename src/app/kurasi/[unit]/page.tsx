import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listLessonsLocal } from "@/lib/content/store";
import ReviewPanel from "./review-panel";

export const metadata: Metadata = {
  title: "Kurasi Unit",
};

export function generateStaticParams() {
  return listLessonsLocal().map((l) => ({ unit: l.id }));
}

export default async function KurasiUnitPage({
  params,
}: {
  params: Promise<{ unit: string }>;
}) {
  const { unit } = await params;
  const lessons = listLessonsLocal();
  const idx = lessons.findIndex((l) => l.id === unit);
  if (idx === -1) notFound();
  const lesson = lessons[idx];
  const prev = idx > 0 ? lessons[idx - 1] : null;
  const next = idx < lessons.length - 1 ? lessons[idx + 1] : null;

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-8">
      <header className="mb-6">
        <p className="text-sm font-medium text-primary">
          <Link href="/kurasi" className="underline underline-offset-2">
            ← Daftar kurasi
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          U{String(lesson.unit_no).padStart(2, "0")} · {lesson.title_id}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {lesson.theme} · {lesson.level} · audio: {lesson.audio_status}
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Tujuan
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {lesson.objectives_id.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          Coba dulu sebagai murid:{" "}
          <Link
            href={`/sesi/${lesson.id}`}
            className="font-semibold text-primary underline underline-offset-2"
          >
            buka sesi latihan ↗
          </Link>
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Dialog — {lesson.dialog.title_id}
        </h2>
        <ol className="mt-3 space-y-3">
          {lesson.dialog.lines.map((line, i) => (
            <li key={i} className="rounded-xl bg-background p-3">
              <p className="text-[11px] font-semibold text-muted">
                {i + 1}. {line.speaker}
              </p>
              <p lang="ja" className="mt-1 text-base font-semibold">
                {line.jp}
              </p>
              <p lang="ja" className="text-xs text-muted">
                {line.kana}
              </p>
              <p className="text-xs italic text-muted">{line.romaji}</p>
              <p className="mt-1 text-sm">{line.id}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Grammar
        </h2>
        <p lang="ja" className="mt-2 text-lg font-bold text-primary">
          {lesson.grammar.pattern}
        </p>
        <pre className="mt-2 overflow-x-auto rounded-xl bg-background p-3 text-xs leading-relaxed">
          {lesson.grammar.formation}
        </pre>
        <p className="mt-2 text-sm">{lesson.grammar.meaning_id}</p>
        <ol className="mt-3 space-y-2">
          {lesson.grammar.examples.map((ex, i) => (
            <li key={i} className="rounded-xl bg-background p-3">
              <p lang="ja" className="font-semibold">
                {ex.jp}
              </p>
              <p className="text-xs italic text-muted">{ex.romaji}</p>
              <p className="mt-1 text-sm">{ex.id}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 rounded-xl border border-dashed border-border p-2 text-[11px] text-muted">
          Bandingkan dengan Minna no Nihongo I / Genki I sebelum memberi
          verdict.
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Kosakata ({lesson.vocab.length})
        </h2>
        <ol className="mt-3 space-y-3">
          {lesson.vocab.map((v, i) => (
            <li key={i} className="rounded-xl bg-background p-3">
              <div className="flex items-baseline gap-2">
                <span lang="ja" className="text-base font-bold">
                  {v.term}
                </span>
                <span lang="ja" className="text-xs text-muted">
                  {v.kana}
                </span>
                <span className="ml-auto text-[11px] italic text-muted">
                  {v.romaji}
                </span>
              </div>
              <p className="mt-0.5 text-sm font-medium">{v.meaning_id}</p>
              <p lang="ja" className="mt-1 text-sm">
                {v.example_jp}
              </p>
              <p className="text-xs italic text-muted">{v.example_romaji}</p>
              <p className="text-xs">{v.example_id}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Huruf ({lesson.writing.length})
        </h2>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {lesson.writing.map((w) => (
            <div
              key={w.char}
              className="rounded-xl bg-background p-2 text-center"
            >
              <p lang="ja" className="text-2xl font-bold">
                {w.char}
              </p>
              <p className="text-[11px] text-muted">{w.romaji}</p>
              <p className="text-[10px] uppercase text-muted">{w.type}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Latihan ({lesson.exercises.length}) — kunci jawaban terlihat
        </h2>
        <ol className="mt-3 space-y-3">
          {lesson.exercises.map((ex, i) => (
            <li key={i} className="rounded-xl bg-background p-3">
              <p className="text-[11px] font-semibold uppercase text-muted">
                {i + 1}. {ex.type}
              </p>
              {ex.type === "listen_choose" && (
                <>
                  <p className="mt-1 text-sm">{ex.prompt_id}</p>
                  <p className="mt-1 text-xs text-muted">
                    baris dialog #{ex.line_index + 1}:{" "}
                    <span lang="ja">{lesson.dialog.lines[ex.line_index]?.jp}</span>
                  </p>
                  <ul className="mt-1 space-y-0.5 text-sm">
                    {ex.options.map((opt, j) => (
                      <li key={j} className={j === ex.answer ? "font-bold text-emerald-600 dark:text-emerald-400" : ""}>
                        {String.fromCharCode(65 + j)}. {opt}
                        {j === ex.answer ? " ✓" : ""}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {ex.type === "arrange" && (
                <>
                  <p className="mt-1 text-sm">
                    Token:{" "}
                    <span lang="ja" className="font-semibold">
                      {ex.tokens.join(" / ")}
                    </span>
                  </p>
                  <p className="mt-1 text-sm">
                    Jawaban:{" "}
                    <span lang="ja" className="font-bold text-emerald-600 dark:text-emerald-400">
                      {ex.answer_jp}
                    </span>
                  </p>
                </>
              )}
              {ex.type === "write_recall" && (
                <p className="mt-1 text-sm">
                  {ex.prompt_id} →{" "}
                  <span lang="ja" className="font-bold text-emerald-600 dark:text-emerald-400">
                    {ex.target_kana}
                  </span>
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      <ReviewPanel lessonId={lesson.id} />

      <nav className="mt-6 flex items-center justify-between gap-3 text-sm">
        {prev ? (
          <Link
            href={`/kurasi/${prev.id}`}
            className="rounded-xl border border-border bg-card px-3 py-2"
          >
            ← U{String(prev.unit_no).padStart(2, "0")}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/kurasi/${next.id}`}
            className="rounded-xl border border-border bg-card px-3 py-2"
          >
            U{String(next.unit_no).padStart(2, "0")} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
