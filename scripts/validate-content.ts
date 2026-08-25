/**
 * CLI: validasi semua konten lewat quality gate.
 * Pakai: npm run content:validate
 * Exit code != 0 jika ada pelajaran gagal gate struktural.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runQualityGate } from "../src/lib/content/quality-gate.ts";

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "..", "content", "lessons");

const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
let failed = 0;

for (const file of files) {
  const raw = JSON.parse(readFileSync(join(dir, file), "utf8"));
  try {
    const report = runQualityGate(raw);
    console.log(`\n📄 ${report.lessonId} (${file})`);
    for (const c of report.checks) {
      const mark = c.pass ? "✅" : c.name.startsWith("Jelas · audio") ? "⏳" : "❌";
      console.log(`  ${mark} ${c.name} — ${c.kriteria}${c.detail ? ` [${c.detail}]` : ""}`);
    }
    if (!report.ok) failed++;
  } catch (err) {
    failed++;
    console.log(`\n📄 ${file} — ❌ SKEMA TIDAK VALID`);
    console.log(`  ${(err as Error).message}`);
  }
}

console.log(`\n${files.length} pelajaran diperiksa, ${failed} gagal.`);
process.exit(failed > 0 ? 1 : 0);
