import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listLessonsLocal } from "@/lib/content/store";
import SessionClient from "../session-client";

export const metadata: Metadata = {
  title: "Sesi 20+5",
};

export function generateStaticParams() {
  return listLessonsLocal().map((l) => ({ unit: l.id }));
}

export default async function SesiUnitPage({
  params,
}: {
  params: Promise<{ unit: string }>;
}) {
  const { unit } = await params;
  const lessons = listLessonsLocal();
  const lesson = lessons.find((l) => l.id === unit);
  if (!lesson) notFound();

  return (
    <SessionClient
      lesson={lesson}
      units={lessons.map((l) => ({
        id: l.id,
        unit_no: l.unit_no,
        title_id: l.title_id,
      }))}
    />
  );
}
