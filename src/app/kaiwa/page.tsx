import KaiwaClient from "./kaiwa-client";
import { listLessonsLocal } from "@/lib/content/store";

export default function KaiwaPage() {
  const lessons = listLessonsLocal();

  // Collect all dialogs from all lessons
  const dialogs = lessons.map((lesson) => ({
    unitId: lesson.id,
    unitNo: lesson.unit_no,
    level: lesson.level,
    theme: lesson.theme,
    ...lesson.dialog,
  }));

  return <KaiwaClient dialogs={dialogs} />;
}