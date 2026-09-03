import ReadingClient from "./reading-client";
import { loadReading } from "@/lib/content/reading";
import { listLessonsLocal } from "@/lib/content/store";

export default function ReadingPage() {
  const items = loadReading();
  const lessons = listLessonsLocal();
  const themeByUnit = new Map(lessons.map((l) => [l.id, l.theme]));

  const itemsWithTheme = items.map((item) => ({
    ...item,
    theme: themeByUnit.get(item.unit_id) ?? "",
  }));

  return <ReadingClient items={itemsWithTheme} />;
}