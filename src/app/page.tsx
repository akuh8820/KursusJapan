import DashboardClient from "./_components/dashboard-client";
import { listLessonsLocal } from "@/lib/content/store";

export default function DashboardPage() {
  const lessons = listLessonsLocal();
  return <DashboardClient lessons={lessons} />;
}