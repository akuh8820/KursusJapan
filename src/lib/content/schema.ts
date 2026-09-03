import { z } from "zod";

/**
 * Skema konten pelajaran multi-indra (PRD §5, §7, §9).
 * Sumber tunggal untuk: generator AI, quality gate, publish script,
 * dan tampilan di app.
 */

export const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
export const jlptLevelSchema = z.enum(JLPT_LEVELS);

export const dialogLineSchema = z.object({
  speaker: z.string().min(1).max(40),
  jp: z.string().min(1),
  kana: z.string().min(1),
  romaji: z
    .string()
    .min(1)
    .regex(/^[a-zA-Zāīūēō' \-.,!?]+$/, "romaji hanya boleh huruf latin"),
  id: z.string().min(4),
});

export type DialogLine = z.infer<typeof dialogLineSchema>;

export const vocabItemSchema = z.object({
  term: z.string().min(1),
  kana: z.string().min(1),
  romaji: z.string().min(1),
  meaning_id: z.string().min(2),
  example_jp: z.string().min(2),
  example_romaji: z.string().min(2),
  example_id: z.string().min(6),
});

export type VocabItem = z.infer<typeof vocabItemSchema>;

export const grammarExampleSchema = z.object({
  jp: z.string().min(2),
  romaji: z.string().min(2),
  id: z.string().min(6),
});

export const grammarPointSchema = z.object({
  pattern: z.string().min(1),
  meaning_id: z.string().min(4),
  formation: z.string().min(3),
  examples: z.array(grammarExampleSchema).min(2),
});

export type GrammarPoint = z.infer<typeof grammarPointSchema>;
export type GrammarExample = z.infer<typeof grammarExampleSchema>;

export const writingTypeSchema = z.enum(["hiragana", "katakana", "kanji"]);

export const writingItemSchema = z
  .object({
    char: z.string().min(1).max(1),
    type: writingTypeSchema,
    romaji: z.string().min(1),
    meaning_id: z.string().optional(),
    kanjivg_id: z.string().optional(),
  })
  .refine((w) => w.type !== "kanji" || Boolean(w.kanjivg_id), {
    message: "kanji wajib punya kanjivg_id (dataset goresan standar, PRD §9.1)",
    path: ["kanjivg_id"],
  })
  .refine((w) => w.type === "kanji" || !w.kanjivg_id, {
    message: "kanjivg_id hanya untuk kanji",
    path: ["kanjivg_id"],
  });

export type WritingItem = z.infer<typeof writingItemSchema>;

export const exerciseTypeSchema = z.enum([
  "listen_choose",
  "arrange",
  "write_recall",
  "flip_card",
  "listen_type",
  "mc_vocab",
]);

const listenChooseSchema = z.object({
  type: z.literal("listen_choose"),
  line_index: z.number().int().min(0),
  prompt_id: z.string().min(4),
  options: z.array(z.string().min(1)).min(3).max(4),
  answer: z.number().int().min(0),
});

const arrangeSchema = z.object({
  type: z.literal("arrange"),
  tokens: z.array(z.string().min(1)).min(3),
  answer_jp: z.string().min(2),
});

const writeRecallSchema = z.object({
  type: z.literal("write_recall"),
  prompt_id: z.string().min(4),
  target_kana: z.string().min(1),
});

/** Kartu bolak-balik: depan jp/kana, belakang arti (PRD §6.4 SRS). */
const flipCardSchema = z.object({
  type: z.literal("flip_card"),
  front_jp: z.string().min(1),
  front_kana: z.string().min(1),
  back_id: z.string().min(2),
});

/**
 * Dengar audio lalu ketik kana yang didengar.
 * audio_ref menunjuk file audio unit: "d03" (baris dialog) / "v02t" (kata) / "v02x" (contoh).
 */
const listenTypeSchema = z.object({
  type: z.literal("listen_type"),
  audio_ref: z
    .string()
    .regex(/^(d\d{2}|v\d{2}[tx])$/, "format audio_ref: d03 / v02t / v02x"),
  target_kana: z.string().min(1),
});

/** Pilih kata yang sesuai arti (pilihan ganda kosakata). */
const mcVocabSchema = z.object({
  type: z.literal("mc_vocab"),
  prompt_id: z.string().min(2),
  options: z.array(z.string().min(1)).min(3).max(4),
  answer: z.number().int().min(0),
});

export const exerciseSchema = z.discriminatedUnion("type", [
  listenChooseSchema,
  arrangeSchema,
  writeRecallSchema,
  flipCardSchema,
  listenTypeSchema,
  mcVocabSchema,
]);

export type Exercise = z.infer<typeof exerciseSchema>;

export const lessonSchema = z.object({
  id: z
    .string()
    .regex(/^n[1-5]-u\d{3}$/, "format id: n{level}-u{nomor unit}, mis. n5-u001"),
  level: jlptLevelSchema,
  unit_no: z.number().int().min(1),
  theme: z.string().min(4),
  title_id: z.string().min(4),
  objectives_id: z.array(z.string().min(8)).min(2),
  dialog: z.object({
    title_id: z.string().min(4),
    lines: z.array(dialogLineSchema).min(6),
  }),
  grammar: grammarPointSchema,
  vocab: z.array(vocabItemSchema).min(8).max(12),
  writing: z.array(writingItemSchema).min(3).max(5),
  exercises: z.array(exerciseSchema).min(4),
  audio_status: z.enum(["pending", "ready"]).default("pending"),
});

export type Lesson = z.infer<typeof lessonSchema>;

export const dailyCardSchema = z.object({
  card_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "format tanggal YYYY-MM-DD"),
  kind: z.enum(["kata", "fakta"]),
  jp: z.string().min(1),
  romaji: z.string().min(1),
  meaning_id: z.string().min(2),
  note_id: z.string().optional(),
});

export type DailyCard = z.infer<typeof dailyCardSchema>;

/** Konjugasi kata kerja & adjektiva (manual curation). */
export const conjugationTypeSchema = z.enum(["verb", "i-adj", "na-adj"]);

export const conjugationFormsSchema = z.object({
  dictionary: z.string(),
  masu: z.string(),
  te: z.string(),
  nai: z.string(),
  ta: z.string(),
  ba: z.string(),
  volitional: z.string(),
});

export type ConjugationForms = z.infer<typeof conjugationFormsSchema>;
export type ConjugationType = z.infer<typeof conjugationTypeSchema>;

export const conjugationEntrySchema = z.object({
  term: z.string().min(1),
  type: conjugationTypeSchema,
  forms: conjugationFormsSchema,
});

export type ConjugationEntry = z.infer<typeof conjugationEntrySchema>;

/** Partikel JLPT N5 (konten baru `content/particles.json`). */
export const particleSchema = z.object({
  id: z.string().min(1),
  char: z.string().min(1),
  romaji: z.string().min(1),
  function_id: z.string().min(2),
  example_jp: z.string().min(2),
  example_romaji: z.string().min(2),
  example_id: z.string().min(4),
  unit_ids: z.array(z.string()).min(1),
});

export type Particle = z.infer<typeof particleSchema>;

export const particlesFileSchema = z.object({
  version: z.number().int().positive(),
  particles: z.array(particleSchema).min(1),
});

/** Soal asesmen campuran (konten baru `content/reading.json`). */
const readingItemBase = {
  id: z.string().min(1),
  unit_id: z.string().regex(/^n[1-5]-u\d{3}$/, "format unit_id: n5-u001"),
  question_id: z.string().min(4),
  choices: z.array(z.string().min(1)).min(2).max(4),
  answer_index: z.number().int().nonnegative(),
};

export const readingItemSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("story"),
    ...readingItemBase,
    prompt_jp: z.string().min(2),
    prompt_romaji: z.string().min(2),
    prompt_id: z.string().min(4),
  }),
  z.object({
    kind: z.literal("gapped_dialog"),
    ...readingItemBase,
    prompt_jp: z.string().min(2),
    prefix_kana: z.string().min(1),
    prefix_romaji: z.string().min(1),
  }),
]);

export type ReadingItem = z.infer<typeof readingItemSchema>;

export const readingFileSchema = z.object({
  version: z.number().int().positive(),
  items: z.array(readingItemSchema).min(1),
});
