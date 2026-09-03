import MateriClient from "./materi-client";
import { listLessonsLocal } from "@/lib/content/store";
import { getUnitLockState } from "@/lib/progress/store";

export default async function MateriPage() {
  const lessons = listLessonsLocal();
  const lockMap = new Map<string, "locked" | "practice_open" | "exam_open" | "exam_passed">();
  for (const l of lessons) {
    lockMap.set(l.id, await getUnitLockState(l.id));
  }

  return <MateriClient lessons={lessons} lockMap={lockMap} />;
}