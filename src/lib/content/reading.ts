import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readingFileSchema, type ReadingItem } from "./schema";

const READING_PATH = join(process.cwd(), "content/reading.json");

let cached: ReadingItem[] | null = null;

/** Loader server-only. Jangan dipanggil dari komponen client. */
export function loadReading(): ReadingItem[] {
  if (cached) return cached;
  const raw = readFileSync(READING_PATH, "utf8");
  const parsed = readingFileSchema.parse(JSON.parse(raw));
  cached = parsed.items;
  return cached;
}

/** Soal ujian untuk unit tertentu (Ujian #n di Materi). */
export function readingForUnit(unitId: string): ReadingItem[] {
  return loadReading().filter((r) => r.unit_id === unitId);
}