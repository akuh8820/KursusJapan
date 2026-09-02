"use client";

import Link from "next/link";
import DailyCardToday from "@/components/daily-card-today";
import FeedbackCard from "@/components/feedback-card";
import ThemeToggle from "@/components/theme-toggle";
import type { Lesson, DailyCard } from "@/lib/content/schema";

const AREAS = [
  {
    href: "/huruf",
    icon: "あ",
    title: "Huruf / Kana",
    desc: "Hiragana, Katakana, & Kanji — latihan baca & tulis",
  },
  {
    href: "/bunpo",
    icon: "文",
    title: "Bunpō (Tata Bahasa)",
    desc: "Pola grammar JLPT N5–N1 dengan contoh & audio",
  },
  {
    href: "/kaiwa",
    icon: "会",
    title: "Kaiwa (Percakapan)",
    desc: "Dialog sehari-hari per unit dengan audio baris per baris",
  },
  {
    href: "/materi",
    icon: "教",
    title: "Materi (Unit JLPT)",
    desc: "30 unit lengkap — vocab, grammar, dialog, latihan",
  },
  {
    href: "/kamus",
    icon: "辞",
    title: "Kamus Jepang",
    desc: "Cari kosakata semua unit + konjugasi kata kerja & adjektiva",
  },
] as const;

export default function DashboardClient({
  lessons,
  dailyCards,
}: {
  lessons: Lesson[];
  dailyCards: DailyCard[];
}) {
  const totalUnits = lessons.length;
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-8">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Go Japan · JLPT</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Selamat datang 👋</h1>
          <p className="mt-1 text-sm text-muted">
            20 menit sehari — dengar, lihat, tulis. Menuju hidupmu di Jepang.
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* Banner iklan placeholder */}
      <aside className="mb-6 rounded-2xl border border-dashed border-border p-3 text-center text-xs text-muted">
        Iklan
      </aside>

      {/* Daily Card */}
      <DailyCardToday cards={dailyCards} />

      {/* 5 Area Portal */}
      <section aria-label="Area belajar" className="mt-6 space-y-3">
        {AREAS.map((area) => (
          <Link
            key={area.href}
            href={area.href}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
          >
            <span
              className="shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary text-2xl font-bold"
              aria-hidden="true"
            >
              {area.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{area.title}</p>
              <p className="mt-0.5 text-sm text-muted truncate">{area.desc}</p>
            </div>
            <span className="shrink-0 text-muted group-hover:text-primary transition" aria-hidden="true">
              →
            </span>
          </Link>
        ))}
      </section>

      {/* Feedback */}
      <FeedbackCard />

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-muted">
        <p className="flex items-center justify-center gap-2">
          <Link href="/kurasi" className="underline hover:text-foreground">
            Kurasi
          </Link>
          <span>·</span>
          <span>{totalUnits} unit</span>
          <span>·</span>
          <span>v0.1.0</span>
        </p>
      </footer>
    </main>
  );
}