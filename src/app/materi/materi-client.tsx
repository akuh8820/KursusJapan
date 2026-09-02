"use client";

import Link from "next/link";
import type { Lesson } from "@/lib/content/schema";

interface MateriClientProps {
  lessons: Lesson[];
  progressMap: Map<string, string>;
}

function statusBadge(status: string | undefined) {
  const config = {
    completed: { label: "Selesai", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    in_progress: { label: "Dipelajari", color: "bg-primary/10 text-primary dark:bg-primary/20" },
    unlocked: { label: "Terbuka", color: "bg-muted/10 text-muted" },
    locked: { label: "Terkunci", color: "bg-muted/10 text-muted/50" },
  } as const;
  const c = config[status as keyof typeof config] ?? config.unlocked;
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${c.color}`}>
      {c.label}
    </span>
  );
}

export default function MateriClient({ lessons, progressMap }: MateriClientProps) {
  const lessonsByLevel = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.level]) acc[lesson.level] = [];
    acc[lesson.level].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  const levelOrder: Record<string, number> = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 };
  const sortedLevels = Object.keys(lessonsByLevel).sort((a, b) => levelOrder[a] - levelOrder[b]);

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-16 pt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Materi (Unit JLPT)</h1>
        <p className="mt-1 text-sm text-muted">Semua unit terbuka — pilih unit mana pun untuk belajar</p>
      </header>

      <section aria-label="Daftar unit per level" className="space-y-6">
        {sortedLevels.map((level) => {
          const levelLessons = lessonsByLevel[level];
          return (
            <article key={level} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <header className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted">{level}</h2>
                <span className="text-xs text-muted">{levelLessons.length} unit</span>
              </header>
              <ol className="mt-3 space-y-2">
                {levelLessons.map((lesson) => {
                  const status = progressMap.get(lesson.id) ?? "unlocked";
                  return (
                    <li key={lesson.id} className="rounded-xl border border-border bg-card p-3 transition">
                      <Link
                        href={`/sesi/${lesson.id}`}
                        className="flex items-center gap-3"
                      >
                        <span className="w-10 shrink-0 text-center text-xs font-bold text-muted">
                          U{String(lesson.unit_no).padStart(2, "0")}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="block truncate text-sm font-semibold">{lesson.title_id}</p>
                          <p className="block truncate text-xs text-muted">
                            {lesson.theme} · {lesson.vocab.length} vocab
                          </p>
                        </div>
                        {statusBadge(status)}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </article>
          );
        })}
      </section>
    </div>
  );
}