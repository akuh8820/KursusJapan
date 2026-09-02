import DashboardClient from "./_components/dashboard-client";
import { listLessonsLocal, listDailyCardsLocal } from "@/lib/content/store";

export default function DashboardPage() {
  const lessons = listLessonsLocal();
  const dailyCards = listDailyCardsLocal();
  return <DashboardClient lessons={lessons} dailyCards={dailyCards} />;
}