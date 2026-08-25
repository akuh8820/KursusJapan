import {
  lessonSchema,
  type Lesson,
  type DailyCard,
  dailyCardSchema,
} from "./schema";

/**
 * Quality gate "Jelas, Berbobot, Efektif" (PRD §9.2).
 * Pengecekan struktural otomatis — kurasi manusia tetap wajib
 * untuk akurasi bahasa & naturalitas sebelum status `published`.
 */

export type GateCheck = {
  name: string;
  kriteria: string;
  pass: boolean;
  detail?: string;
};

export type GateReport = {
  lessonId: string;
  ok: boolean;
  checks: GateCheck[];
};

function hasEmptyString(obj: unknown, path = ""): string | null {
  if (typeof obj === "string") return obj.trim().length === 0 ? path : null;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const found = hasEmptyString(obj[i], `${path}[${i}]`);
      if (found) return found;
    }
    return null;
  }
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      const found = hasEmptyString(v, path ? `${path}.${k}` : k);
      if (found) return found;
    }
  }
  return null;
}

export function checkLesson(lesson: Lesson): GateReport {
  const checks: GateCheck[] = [];

  // ---------- JELAS ----------
  const emptyAt = hasEmptyString(
    (({ id, level, unit_no, theme, title_id, objectives_id, dialog, grammar, vocab, writing }) => ({
      id,
      level,
      unit_no,
      theme,
      title_id,
      objectives_id,
      dialog,
      grammar,
      vocab,
      writing,
    }))(lesson),
  );
  checks.push({
    name: "Jelas · tidak ada field kosong",
    kriteria: "furigana/romaji/arti terisi semua",
    pass: emptyAt === null,
    detail: emptyAt ? `kosong di: ${emptyAt}` : undefined,
  });

  const romajiOk = [
    ...lesson.dialog.lines.map((l) => l.romaji),
    ...lesson.vocab.map((v) => v.romaji),
    ...lesson.writing.map((w) => w.romaji),
  ].every((r) => /^[a-zA-Zāīūēō' \-.,!?]+$/.test(r));
  checks.push({
    name: "Jelas · romaji konsisten",
    kriteria: "semua romaji huruf latin standar",
    pass: romajiOk,
  });

  checks.push({
    name: "Jelas · audio",
    kriteria: "audio_status ready (bersih & tempo wajar)",
    pass: lesson.audio_status === "ready",
    detail:
      lesson.audio_status === "pending"
        ? "menunggu TTS/kurasi audio — boleh publish sebagai draft"
        : undefined,
  });

  // ---------- BERBOBOT ----------
  checks.push({
    name: "Berbobot · vocab 8–12",
    kriteria: "8–12 kata baru",
    pass: lesson.vocab.length >= 8 && lesson.vocab.length <= 12,
    detail: `dapat ${lesson.vocab.length}`,
  });

  checks.push({
    name: "Berbobot · tulis 3–5 karakter",
    kriteria: "3–5 karakter kana/kanji",
    pass: lesson.writing.length >= 3 && lesson.writing.length <= 5,
    detail: `dapat ${lesson.writing.length}`,
  });

  checks.push({
    name: "Berbobot · 1 pola grammar + ≥2 contoh",
    kriteria: "pola grammar dengan contoh natural",
    pass: lesson.grammar.examples.length >= 2,
    detail: `contoh: ${lesson.grammar.examples.length}`,
  });

  checks.push({
    name: "Berbobot · dialog cukup panjang",
    kriteria: "≥6 baris dialog kontekstual",
    pass: lesson.dialog.lines.length >= 6,
    detail: `baris: ${lesson.dialog.lines.length}`,
  });

  // ---------- EFEKTIF ----------
  const types = new Set(lesson.exercises.map((e) => e.type));
  const allSenses = ["listen_choose", "arrange", "write_recall"].every((t) =>
    types.has(t as never),
  );
  checks.push({
    name: "Efektif · latihan gabungan 3 indra",
    kriteria: "≥4 soal mencakup dengar+lihat+tulis",
    pass: lesson.exercises.length >= 4 && allSenses,
    detail: `soal: ${lesson.exercises.length}, jenis: ${[...types].join(", ")}`,
  });

  const listenValid = lesson.exercises
    .filter((e) => e.type === "listen_choose")
    .every((e) => e.line_index < lesson.dialog.lines.length);
  checks.push({
    name: "Efektif · indeks audio valid",
    kriteria: "listen_choose merujuk baris dialog yang ada",
    pass: listenValid,
  });

  const arrangeValid = lesson.exercises
    .filter((e) => e.type === "arrange")
    .every((e) => e.answer_jp.replace(/[。、!?. ]/g, "") !== "");
  checks.push({
    name: "Efektif · susun kalimat punya jawaban",
    kriteria: "setiap soal arrange punya answer_jp",
    pass: arrangeValid,
  });

  return {
    lessonId: lesson.id,
    ok: checks.every((c) => c.pass || c.name.startsWith("Jelas · audio")),
    checks,
  };
}

/** Validasi penuh (skema + gate). Lempar error jika skema tidak valid. */
export function runQualityGate(rawLesson: unknown): GateReport {
  const parsed = lessonSchema.parse(rawLesson);
  return checkLesson(parsed);
}

export function validateDailyCard(raw: unknown): DailyCard {
  return dailyCardSchema.parse(raw);
}
