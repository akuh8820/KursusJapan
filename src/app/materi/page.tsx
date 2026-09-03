import MateriClient from "./materi-client";
import { listLessonsLocal } from "@/lib/content/store";
import { getUnitLockState } from "@/lib/progress/store";

export default async function MateriPage() {
  const lessons = listLessonsLocal();
  // Urut lockstep by unit_no (materi diurutkan per level; gating mengikuti urutan unit_no).
  const ordered = [...lessons].sort((a, b) => a.unit_no - b.unit_no);
  const lockMap = new Map<string, "locked" | "practice_open" | "exam_open" | "exam_passed">();
  for (let i = 0; i < ordered.length; i++) {
    const prev = i > 0 ? ordered[i - 1].id : null;
    lockMap.set(ordered[i].id, await getUnitLockState(ordered[i].id, prev));
  }

  return <MateriClient lessons={lessons} lockMap={lockMap} />;
}