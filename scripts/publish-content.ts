/**
 * CLI: publish konten ke Supabase (tabel lessons + daily_cards).
 * Pakai: npm run content:publish
 *
 * Butuh env: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * Tanpa env → mode dry-run: validasi saja, tidak menulis DB.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { runQualityGate } from "../src/lib/content/quality-gate.ts";
import type { Lesson } from "../src/lib/content/schema.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const dryRun = !(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const lessonsDir = join(root, "content", "lessons");
  const files = readdirSync(lessonsDir).filter((f) => f.endsWith(".json")).sort();

  const ready: Array<{ lesson: Lesson; curated: boolean }> = [];
  for (const file of files) {
    const raw = JSON.parse(readFileSync(join(lessonsDir, file), "utf8"));
    const report = runQualityGate(raw);
    if (!report.ok) {
      console.error(`❌ ${file} gagal quality gate — jalankan dulu: npm run content:validate`);
      process.exit(1);
    }
    // audio belum siap → masuk sebagai draft menunggu kurasi audio manusia
    const curated = raw.audio_status === "ready";
    ready.push({ lesson: raw as Lesson, curated });
  }

  const cards = JSON.parse(
    readFileSync(join(root, "content", "daily-cards.json"), "utf8"),
  );

  console.log(`📦 ${ready.length} pelajaran lolos gate struktural.`);
  console.log(`📅 ${cards.length} kartu harian dimuat.`);

  if (dryRun) {
    console.log("\n🧪 DRY-RUN (env Supabase belum diisi). Yang akan dipublish:");
    for (const { lesson, curated } of ready) {
      console.log(`  ${curated ? "published" : "draft   "} · ${lesson.id} · ${lesson.title_id}`);
    }
    return;
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  for (const { lesson, curated } of ready) {
    const row = {
      id: lesson.id,
      level: lesson.level,
      unit_no: lesson.unit_no,
      theme: lesson.theme,
      title: lesson.title_id,
      duration_min: 20,
      status: curated ? "published" : "review",
      content: lesson,
      audio_status: lesson.audio_status,
      changelog: [{ at: new Date().toISOString(), action: "pipeline-publish" }],
      published_at: curated ? new Date().toISOString() : null,
    };
    const { error } = await supabase.from("lessons").upsert(row);
    if (error) {
      console.error(`❌ upsert ${lesson.id}: ${error.message}`);
      process.exitCode = 1;
    } else {
      console.log(`✅ ${row.status} · ${lesson.id}`);
    }
  }

  const { error: cardErr } = await supabase
    .from("daily_cards")
    .upsert(cards, { onConflict: "card_date" });
  if (cardErr) {
    console.error(`❌ daily_cards: ${cardErr.message}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ ${cards.length} kartu harian tersimpan`);
  }
}

main();
