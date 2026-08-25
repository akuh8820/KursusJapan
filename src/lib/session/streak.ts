/**
 * Streak lokal (localStorage) — aturan PRD §6.1: streak bertambah hanya
 * jika 1 siklus penuh 20+5 selesai, maksimal +1 per hari JST.
 * Migrasi ke tabel user_stats Supabase setelah login MVP aktif.
 */

const KEY = "fasih.streak.v1";

export type StreakState = { count: number; lastDate: string | null };

export function todayJST(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function getStreak(): StreakState {
  if (typeof window === "undefined") return { count: 0, lastDate: null };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { count: 0, lastDate: null };
    const parsed = JSON.parse(raw) as Partial<StreakState>;
    if (typeof parsed.count !== "number" || typeof parsed.lastDate === "number") {
      return { count: 0, lastDate: null };
    }
    return { count: parsed.count, lastDate: parsed.lastDate ?? null };
  } catch {
    return { count: 0, lastDate: null };
  }
}

function prevDayISO(iso: string): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) - 86_400_000)
    .toISOString()
    .slice(0, 10);
}

export function recordCycleComplete(): StreakState {
  const today = todayJST();
  const cur = getStreak();
  let count: number;
  if (cur.lastDate === today) {
    count = Math.max(cur.count, 1);
  } else if (cur.lastDate && cur.lastDate === prevDayISO(today)) {
    count = cur.count + 1;
  } else {
    count = 1;
  }
  const next: StreakState = { count, lastDate: today };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
