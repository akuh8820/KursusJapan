import BunpoClient from "./bunpo-client";
import { listLessonsLocal } from "@/lib/content/store";

export default function BunpoPage() {
  const lessons = listLessonsLocal();

  // Collect all grammar points from all lessons
  const grammarPoints = lessons.map((lesson) => ({
    unitId: lesson.id,
    unitNo: lesson.unit_no,
    level: lesson.level,
    theme: lesson.theme,
    ...lesson.grammar,
  }));

  return <BunpoClient grammarPoints={grammarPoints} />;
}