/**
 * Status kurasi manusia (PRD §9.2) — disimpan di localStorage sampai
 * Supabase aktif; bisa diekspor JSON untuk lampiran/arsip keputusan.
 * Key: gojapan.kurasi.v1
 */

export const SECTION_KEYS = [
  "dialog",
  "grammar",
  "vocab",
  "writing",
  "exercises",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export type Verdict = "ok" | "problem";

export type SectionReview = {
  verdict: Verdict | null;
  note: string;
};

export type LessonReview = {
  sections: Record<SectionKey, SectionReview>;
  updatedAt: string | null;
};

export type KurasiState = Record<string, LessonReview>;

const KEY = "gojapan.kurasi.v1";
const EXPORT_VERSION = 1;

export const SECTION_LABELS: Record<SectionKey, string> = {
  dialog: "Dialog",
  grammar: "Grammar",
  vocab: "Kosakata",
  writing: "Huruf",
  exercises: "Latihan",
};

export function emptyLessonReview(): LessonReview {
  return {
    sections: Object.fromEntries(
      SECTION_KEYS.map((k) => [k, { verdict: null, note: "" }]),
    ) as Record<SectionKey, SectionReview>,
    updatedAt: null,
  };
}

function normalize(raw: unknown): KurasiState {
  if (typeof raw !== "object" || raw === null) return {};
  const out: KurasiState = {};
  for (const [lessonId, value] of Object.entries(
    raw as Record<string, unknown>,
  )) {
    if (typeof value !== "object" || value === null) continue;
    const v = value as { sections?: unknown; updatedAt?: unknown };
    const review = emptyLessonReview();
    const sections = (v.sections ?? {}) as Record<string, unknown>;
    for (const k of SECTION_KEYS) {
      const s = sections[k];
      if (typeof s !== "object" || s === null) continue;
      const sv = s as { verdict?: unknown; note?: unknown };
      review.sections[k].verdict =
        sv.verdict === "ok" || sv.verdict === "problem" ? sv.verdict : null;
      review.sections[k].note = typeof sv.note === "string" ? sv.note : "";
    }
    review.updatedAt = typeof v.updatedAt === "string" ? v.updatedAt : null;
    out[lessonId] = review;
  }
  return out;
}

function getKurasiState(): KurasiState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    return normalize(JSON.parse(raw));
  } catch {
    return {};
  }
}

// Lapisan store eksternal untuk useSyncExternalStore: snapshot di-cache agar
// identitasnya stabil antar-render, penulis memberi tahu pelanggan.
const EMPTY_STATE: KurasiState = {};
let cache: KurasiState | null = null;
const listeners = new Set<() => void>();

export function subscribeKurasi(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getKurasiSnapshot(): KurasiState {
  if (typeof window === "undefined") return EMPTY_STATE;
  if (cache === null) cache = getKurasiState();
  return cache;
}

export function getKurasiServerSnapshot(): KurasiState {
  return EMPTY_STATE;
}

export function saveSection(
  lessonId: string,
  section: SectionKey,
  patch: Partial<Pick<SectionReview, "verdict" | "note">>,
): void {
  if (typeof window === "undefined") return;
  const current = getKurasiSnapshot();
  const review = current[lessonId] ?? emptyLessonReview();
  review.sections[section] = { ...review.sections[section], ...patch };
  review.updatedAt = new Date().toISOString();
  cache = { ...current, [lessonId]: review };
  window.localStorage.setItem(KEY, JSON.stringify(cache));
  for (const l of listeners) l();
}

export function lessonProgress(review: LessonReview | undefined): {
  done: number;
  problems: number;
} {
  if (!review) return { done: 0, problems: 0 };
  let done = 0;
  let problems = 0;
  for (const k of SECTION_KEYS) {
    const v = review.sections[k].verdict;
    if (v !== null) done++;
    if (v === "problem") problems++;
  }
  return { done, problems };
}

export function buildExport(state: KurasiState): string {
  return JSON.stringify(
    {
      tool: "gojapan-kurasi",
      version: EXPORT_VERSION,
      exported_at: new Date().toISOString(),
      reviews: state,
    },
    null,
    2,
  );
}
