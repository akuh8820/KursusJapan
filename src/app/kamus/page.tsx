import KamusClient from "./kamus-client";
import { listLessonsLocal } from "@/lib/content/store";
import { loadConjugations } from "@/lib/content/conjugations";

export default function KamusPage() {
  const lessons = listLessonsLocal();
  const conjugations = loadConjugations();

  // Collect all vocab from all lessons
  const allVocab = lessons.flatMap((lesson) =>
    lesson.vocab.map((v, vocabIdx) => ({
      ...v,
      unitId: lesson.id,
      unitNo: lesson.unit_no,
      level: lesson.level,
      theme: lesson.theme,
      vocabIdx,
      audioReady: lesson.audio_status === "ready",
    }))
  );

  // Sort by term (kana)
  allVocab.sort((a, b) => a.kana.localeCompare(b.kana, "ja"));

  return <KamusClient vocab={allVocab} conjugations={conjugations.entries} />;
}