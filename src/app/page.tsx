"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DailyCardToday from "@/components/daily-card-today";
import FeedbackCard from "@/components/feedback-card";
import ThemeToggle from "@/components/theme-toggle";
import { listLessonsLocal } from "@/lib/content/store";
import { listUnitProgress, getSrsDue } from "@/lib/progress/store";
import type { Lesson } from "@/lib/content/schema";

function levelOrder(level: string): number {
  const order: Record<string, number> = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 };
  return order[level] ?? 99;
}

function formatUnitNo(unitNo: number): string {
  return `U${String(unitNo).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const lessons = listLessonsLocal();
  const [unitProgress, setUnitProgress] = useState<Map<string, { status: string }>>(new Map());
  const [srsDueCount, setSrsDueCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const [progress, due] = await Promise.all([listUnitProgress(), getSrsDue()]);
      const map = new Map(progress.map((p) => [p.unitId, { status: p.status }]));
      setUnitProgress(map);
      setSrsDueCount(due.length);
      setHydrated(true);
    })();
  }, []);

  const lessonsByLevel = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.level]) acc[lesson.level] = [];
    acc[lesson.level].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  const sortedLevels = Object.keys(lessonsByLevel).sort((a, b) => levelOrder(a) - levelOrder(b));

  if (!hydrated) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Go Japan · JLPT</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Selamat datang 👋</h1>
            <p className="mt-1 text-sm text-muted">20 menit sehari — dengar, lihat, tulis. Menuju hidupmu di Jepang.</p>
          </div>
          <ThemeToggle />
        </header>
        <DailyCardToday cards={[]} />
        <div className="mt-8 space-y-4">
          {sortedLevels.map((level) => (
            <section key={level} className="rounded-2xl border border-border bg-card p-4 shadow-sm animate-pulse">
              <h2 className="text-sm font-semibold text-muted">{level} ({lessonsByLevel[level].length} unit)</h2>
              <div className="mt-3 space-y-2">
                {lessonsByLevel[level].slice(0, 3).map(() => (
                  <div key={Math.random()} className="h-14 rounded-xl border border-border bg-muted/20" />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    );
  }

  const totalUnits = lessons.length;
  const completedUnits = Array.from(unitProgress.values()).filter((p) => p.status === "completed").length;

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-8">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Go Japan · JLPT</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Selamat datang 👋</h1>
          <p className="mt-1 text-sm text-muted">20 menit sehari — dengar, lihat, tulis. Menuju hidupmu di Jepang.</p>
        </div>
        <ThemeToggle />
      </header>

      {/* Banner iklan placeholder */}
      <aside className="mb-6 rounded-2xl border border-dashed border-border p-3 text-center text-xs text-muted">
        Iklan
      </aside>

      {/* Daily Card */}
      <DailyCardToday cards={[]} />

      {/* Ulasan SRS */}
      {srsDueCount > 0 && (
        <section className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <Link href="/ulasan" className="flex items-center gap-3">
            <span className="rounded-xl bg-primary p-2 text-primary-foreground" aria-hidden="true">🔁</span>
            <div className="flex-1">
              <p className="font-semibold text-primary-foreground">Ulasan kosakata</p>
              <p className="text-xs text-primary-foreground/80">{srsDueCount} kartu jatuh tempo</p>
            </div>
            <span className="text-primary-foreground/60" aria-hidden="true">→</span>
          </Link>
        </section>
      )}

      {/* Roadmap JLPT */}
      <section aria-label="Roadmap JLPT" className="mt-6 space-y-6">
        {sortedLevels.map((level) => {
          const levelLessons = lessonsByLevel[level];
          const levelCompleted = levelLessons.filter((l) => unitProgress.get(l.id)?.status === "completed").length;
          return (
            <article key={level} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <header className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted">{level}</h2>
                <span className="text-xs text-muted">{levelCompleted} / {levelLessons.length} selesai</span>
              </header>
              <ol className="mt-3 space-y-2">
                {levelLessons.map((lesson, idx) => {
                  const progress = unitProgress.get(lesson.id);
                  const status = progress?.status ?? (idx === 0 ? "unlocked" : "locked");
                  const isFirst = idx === 0;
                  const prevLesson = idx > 0 ? levelLessons[idx - 1] : null;
                  const prevCompleted = prevLesson ? unitProgress.get(prevLesson.id)?.status === "completed" : false;
                  const unlocked = isFirst || prevCompleted || status !== "locked";

                  const statusMap = {
                    completed: { label: "Selesai", color: "text-emerald-600 dark:text-emerald-400", icon: "✅" },
                    in_progress: { label: "Sedang dipelajari", color: "text-primary", icon: "📖" },
                    unlocked: { label: "Terbuka", color: "text-muted", icon: "🔓" },
                    locked: { label: "Terkunci", color: "text-muted/50", icon: "🔒" },
                  } as const;
                  const statusConfig = statusMap[status as keyof typeof statusMap] ?? statusMap.locked;

                  return (
                    <li key={lesson.id} className={`flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition ${!unlocked ? "opacity-50" : ""}`}>
                      <span className="w-10 shrink-0 text-center text-xs font-bold text-muted">{formatUnitNo(lesson.unit_no)}</span>
                      <Link
                        href={`/sesi/${lesson.id}`}
                        className="min-w-0 flex-1"
                        style={{ pointerEvents: unlocked ? "auto" : "none" }}
                      >
                        <span className="block truncate text-sm font-semibold">{lesson.title_id}</span>
                        <span className="block truncate text-xs text-muted">{lesson.theme} · {lesson.vocab.length} vocab</span>
                      </Link>
                      <span className={`shrink-0 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusConfig.color}`}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </article>
          );
        })}
      </section>

      {/* Progress summary */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium">Progres total</p>
        <p className="mt-1 text-2xl font-bold">{completedUnits} dari {totalUnits} unit selesai</p>
        <div className="mt-3 h-2 rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: totalUnits > 0 ? `${(completedUnits / totalUnits) * 100}%` : "0%" }}
          />
        </div>
      </section>

      {/* Feedback */}
      <FeedbackCard />

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-muted">
        <p className="flex items-center justify-center gap-2">
          <Link href="/kurasi" className="underline hover:text-foreground">Kurasi</Link>
          <span>·</span>
          <span>v0.1.0</span>
        </p>
      </footer>
    </main>
  );
}