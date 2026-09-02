import MateriClient from "./materi-client";
import { listLessonsLocal } from "@/lib/content/store";
import { listUnitProgress } from "@/lib/progress/store";

export default async function MateriPage() {
  const lessons = listLessonsLocal();
  const unitProgress = await listUnitProgress();
  const progressMap = new Map(unitProgress.map((p) => [p.unitId, p.status]));

  return <MateriClient lessons={lessons} progressMap={progressMap} />;
}