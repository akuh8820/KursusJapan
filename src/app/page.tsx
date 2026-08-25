import type { Metadata } from "next";
import Link from "next/link";
import DailyCardToday from "@/components/daily-card-today";
import StreakBadge from "@/components/streak-badge";
import {
  listDailyCardsLocal,
  listLessonsLocal,
} from "@/lib/content/store";

export const metadata: Metadata = {
  title: "Dashboard",
};

const levelLabel: Record<string, string> = {
  draft: "Draft",
  review: "Kurasi",
  published: "Tersedia",
};

export default function DashboardPage() {
  const lessons = listLessonsLocal();
  const cards = listDailyCardsLocal();
  const publishedCount = 0; // diisi dari DB setelah kurasi audio selesai (F1)
  const firstUnitHref = lessons[0] ? `/sesi/${lessons[0].id}` : "/sesi";

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-8">
      <header className="mb-6">
        <p className="text-sm font-medium text-primary">Fasih · JLPT N5</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Selamat datang 👋
        </h1>
        <p className="mt-1 text-sm text-muted">
          20 menit sehari — dengar, lihat, tulis. Menuju hidupmu di Jepang.
        </p>
      </header>

      {/* Kartu Hari Ini (fitur #8 PRD) — dipilih client-side per hari JST */}
      <DailyCardToday cards={cards} />

      {/* Sesi & streak */}
      <section className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted">Streak</p>
          <StreakBadge />
          <p className="mt-1 text-[11px] leading-snug text-muted">
            Selesaikan siklus 20+5 untuk menyalakan streak 🔥
          </p>
        </div>
        <div className="flex flex-col justify-between rounded-2xl bg-primary p-4 text-primary-foreground shadow-sm">
          <p className="text-xs opacity-90">Sesi hari ini</p>
          <Link
            href={firstUnitHref}
            className="mt-2 inline-block rounded-xl bg-white/20 px-3 py-2 text-center text-sm font-semibold transition active:scale-[0.99]"
          >
            Mulai 20 menit ▶
          </Link>
        </div>
      </section>

      {/* Daftar unit pilot F0 */}
      <section aria-label="Unit pelajaran" className="mt-6">
        <h2 className="text-sm font-semibold text-muted">
          Unit N5 pilot ({lessons.length}) — pipeline F0
        </h2>
        <ol className="mt-3 space-y-2">
          {lessons.map((l) => (
            <li key={l.id}>
              <Link
                href={`/sesi/${l.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition hover:border-primary/40"
              >
                <span className="w-10 shrink-0 text-center text-xs font-bold text-muted">
                  {String(l.unit_no).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {l.title_id}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {l.theme} · {l.vocab.length} vocab · {l.writing.length} huruf
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-muted/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {levelLabel.draft /* status DB menyusul */}
                </span>
              </Link>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[11px] text-muted">
          {publishedCount} unit tersedia publik · sisanya menunggu kurasi audio &
          quality gate manusia (PRD §9.2).
        </p>
      </section>

      {/* Slot iklan non-intrusif — hanya footer dashboard (PRD §10) */}
      <aside className="mt-8 rounded-xl border border-dashed border-border p-4 text-center text-[11px] text-muted">
        Slot iklan non-intrusif (banner) — tidak pernah tampil di fase fokus.
      </aside>
    </main>
  );
}
