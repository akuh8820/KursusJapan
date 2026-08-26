import type { Metadata } from "next";
import { listLessonsLocal } from "@/lib/content/store";
import KurasiIndex from "./kurasi-index";

export const metadata: Metadata = {
  title: "Kurasi Konten",
};

export default function KurasiPage() {
  const lessons = listLessonsLocal();
  return (
    <KurasiIndex
      lessons={lessons.map((l) => ({
        id: l.id,
        unit_no: l.unit_no,
        title_id: l.title_id,
        theme: l.theme,
      }))}
    />
  );
}
