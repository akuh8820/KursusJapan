import HurufClient from "./huruf-client";
import { listLessonsLocal } from "@/lib/content/store";

export default function HurufPage() {
  const lessons = listLessonsLocal();

  // Collect all unique writing characters from all lessons
  const charMap = new Map<string, { char: string; type: "hiragana" | "katakana" | "kanji"; romaji: string; meaning_id?: string; kanjivg_id?: string }>();
  for (const lesson of lessons) {
    for (const w of lesson.writing) {
      if (!charMap.has(w.char)) {
        charMap.set(w.char, w);
      }
    }
  }

  const hiragana = Array.from(charMap.values()).filter((w) => w.type === "hiragana").sort((a, b) => a.romaji.localeCompare(b.romaji));
  const katakana = Array.from(charMap.values()).filter((w) => w.type === "katakana").sort((a, b) => a.romaji.localeCompare(b.romaji));
  const kanji = Array.from(charMap.values()).filter((w) => w.type === "kanji").sort((a, b) => a.romaji.localeCompare(b.romaji));

  return <HurufClient hiragana={hiragana} katakana={katakana} kanji={kanji} />;
}