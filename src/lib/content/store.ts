import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonSchema, dailyCardSchema, type Lesson, type DailyCard } from "./schema";
import { getSupabase } from "@/lib/supabase/server";

/**
 * Sumber data konten untuk tampilan.
 * Urutan: Supabase (jika terpasang) → fallback file lokal content/.
 * Selama F0 file lokal adalah sumber kebenaran; sejak Supabase aktif,
 * pipeline publish yang mengisi DB (scripts/publish-content.ts).
 */

const CONTENT_ROOT = join(process.cwd(), "content");

export function listLessonsLocal(): Lesson[] {
  const dir = join(CONTENT_ROOT, "lessons");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  return files
    .map((f) => lessonSchema.parse(JSON.parse(readFileSync(join(dir, f), "utf8"))))
    .sort((a, b) => a.unit_no - b.unit_no);
}

export function listDailyCardsLocal(): DailyCard[] {
  const raw = JSON.parse(readFileSync(join(CONTENT_ROOT, "daily-cards.json"), "utf8"));
  return (raw as unknown[]).map((c) => dailyCardSchema.parse(c));
}

export function todayISO(): string {
  // Waktu JST dipakai sebagai acuan "hari ini" produk (target user di Jepang).
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

export async function getDailyCard(): Promise<DailyCard | null> {
  const today = todayISO();
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("daily_cards")
      .select("*")
      .eq("card_date", today)
      .maybeSingle();
    if (data) return dailyCardSchema.parse(data);
  }
  const cards = listDailyCardsLocal();
  return cards.find((c) => c.card_date === today) ?? cards[cards.length - 1] ?? null;
}

export async function getLessons(): Promise<Lesson[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("lessons")
      .select("content")
      .order("unit_no", { ascending: true });
    if (data && data.length > 0) {
      return data.map((r) => lessonSchema.parse(r.content));
    }
  }
  return listLessonsLocal();
}
