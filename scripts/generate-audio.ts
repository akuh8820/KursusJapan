/**
 * CLI: generate audio TTS (VOICEVOX) untuk semua pelajaran.
 * Pakai: npm run audio:generate [-- --only n5-u001,n5-u002] [--force]
 *        npm run audio:generate -- --mark-ready n5-u001   (setelah kurasi manusia)
 *
 * Engine (default): api.tts.quest v3 — backend VOICEVOX gratis, tanpa API key.
 * Rate limit ±1 request/2 detik → script otomatis backoff saat 429 dan
 * berjalan sekuensial. Idempoten: file yang sudah ada + hash teks sama
 * di-skip, jadi aman di-rerun kapan pun.
 *
 * Output per unit:
 *   public/audio/{unit}/d{00}.mp3…   baris dialog (suara per tokoh)
 *   public/audio/{unit}/v{00}t.mp3   kosakata: kata
 *   public/audio/{unit}/v{00}x.mp3   kosakata: contoh kalimat
 *   public/audio/{unit}/manifest.json
 *
 * Catatan PRD §9.2: generate otomatis TIDAK mengubah audio_status —
 * status "ready" hanya lewat --mark-ready setelah kurasi telinga manusia.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { lessonSchema, type Lesson } from "../src/lib/content/schema.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const lessonsDir = join(root, "content", "lessons");
const audioRoot = join(root, "public", "audio");

const API_BASE = process.env.TTSQUEST_BASE ?? "https://api.tts.quest/v3/voicevox/synthesis";
const POLL_MS = 2500;
const POLL_MAX = 60;
const GAP_MS = 2200; // hormati rate limit ±1 req/2s
const RETRY_MAX = 8;

type VoiceConfig = { default: number; roles: Record<string, number> };
type Item = { file: string; text: string; speaker_id: number; speaker_name?: string; hash: string };
type Manifest = {
  unit: string;
  generated_at: string;
  engine: "ttsquest-voicevox";
  items: Item[];
};

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const listArg = (name: string): string[] | null => {
  const i = args.indexOf(name);
  if (i === -1) return null;
  return (args[i + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
};
const only = listArg("--only");
const markReady = listArg("--mark-ready") ?? [];
const force = flag("--force");

const voices: VoiceConfig = JSON.parse(readFileSync(join(here, "audio-voices.json"), "utf8"));

function sha(s: string): string {
  return createHash("sha1").update(s).digest("hex").slice(0, 16);
}

function loadLessons(): Lesson[] {
  return readdirSorted()
    .filter((f) => !only || only.includes(f.replace(/\.json$/, "")))
    .map((f) => lessonSchema.parse(JSON.parse(readFileSync(join(lessonsDir, f), "utf8"))));
}
function readdirSorted(): string[] {
  return readdirSync(lessonsDir).filter((f) => f.endsWith(".json")).sort();
}

function planUnit(lesson: Lesson): Item[] {
  const items: Item[] = [];
  const roleOf = (speaker: string) => voices.roles[speaker] ?? voices.default;
  lesson.dialog.lines.forEach((line, i) => {
    items.push({
      file: `d${String(i).padStart(2, "0")}.mp3`,
      text: line.jp,
      speaker_id: roleOf(line.speaker),
      hash: "",
    });
  });
  lesson.vocab.forEach((v, i) => {
    items.push({ file: `v${String(i).padStart(2, "0")}t.mp3`, text: v.term, speaker_id: voices.default, hash: "" });
    items.push({ file: `v${String(i).padStart(2, "0")}x.mp3`, text: v.example_jp, speaker_id: voices.default, hash: "" });
  });
  for (const it of items) it.hash = sha(`${it.speaker_id}\u0000${it.text}`);
  return items;
}

let lastRequestAt = 0;
async function gap() {
  const wait = lastRequestAt + GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** fetch dengan retry utk error jaringan (jaringan mobile sering drop). */
async function fetchRetry(url: string, init?: RequestInit): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) });
    } catch (err) {
      if (++attempt > RETRY_MAX) throw err;
      const waitS = Math.min(15, 3 * attempt);
      const code = (err as { cause?: { code?: string } }).cause?.code ?? (err as Error).message;
      process.stdout.write(`  ⏳ jaringan gagal (${code}), ulang ${waitS}s\n`);
      await sleep(waitS * 1000);
    }
  }
}

async function ttsQuestSynth(text: string, speaker: number): Promise<Buffer> {
  let attempt = 0;
  while (true) {
    await gap();
    const res = await fetchRetry(`${API_BASE}?text=${encodeURIComponent(text)}&speaker=${speaker}`);
    let job: Record<string, unknown>;
    try {
      job = (await res.json()) as Record<string, unknown>;
    } catch {
      throw new Error(`HTTP ${res.status} (respons bukan JSON)`);
    }
    // 429 dikirim sebagai JSON errorMessage=429 ATAU HTTP 429 asli
    const rl = job.errorMessage === 429 || res.status === 429;
    if (rl && attempt++ < RETRY_MAX) {
      const after = Number(job.retryAfter ?? 2.5) * 1000;
      process.stdout.write(`  ⏳ rate limit, tunggu ${Math.round(after / 100) / 10}s\n`);
      await sleep(after);
      continue;
    }
    if (!job.success || typeof job.audioStatusUrl !== "string" || typeof job.mp3DownloadUrl !== "string") {
      throw new Error(`gagal minta sintesis: ${JSON.stringify(job).slice(0, 200)}`);
    }
    for (let i = 0; i < POLL_MAX; i++) {
      await sleep(POLL_MS);
      const stRes = await fetchRetry(job.audioStatusUrl as string);
      const st = (await stRes.json()) as Record<string, unknown>;
      if (st.isAudioError) throw new Error(`engine error untuk teks: ${text}`);
      if (st.isAudioReady !== true) continue;
      const mp3 = await (await fetchRetry(job.mp3DownloadUrl as string)).arrayBuffer();
      const buf = Buffer.from(mp3);
      const head = buf.subarray(0, 3);
      const okMp3 =
        head.toString("latin1") === "ID3" ||
        (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0);
      if (!okMp3 || buf.length < 1000) throw new Error(`MP3 tidak valid (${buf.length} B)`);
      return buf;
    }
    throw new Error(`timeout polling audio: ${text}`);
  }
}

async function main() {
  console.log("🎙️  Generate audio TTS (VOICEVOX via tts.quest)\n");
  if (only) console.log(`Filter unit: ${only.join(", ")}`);

  // Dedupe lintas unit: teks+suara identik cukup disintesis sekali.
  const lessons = loadLessons();
  const byHash = new Map<string, Buffer>();
  const totals = { synth: 0, skip: 0 };
  const failed: string[] = [];

  for (const lesson of lessons) {
    const outDir = join(audioRoot, lesson.id);
    mkdirSync(outDir, { recursive: true });
    const manifestPath = join(outDir, "manifest.json");
    const old: Manifest | null = existsSync(manifestPath)
      ? safeParse(readFileSync(manifestPath, "utf8"))
      : null;
    const oldByFile = new Map((old?.items ?? []).map((it) => [it.file, it]));

    const plan = planUnit(lesson);
    const done: Item[] = [];
    let regenerated = 0;

    for (const item of plan) {
      const prev = oldByFile.get(item.file);
      if (!force && prev && prev.hash === item.hash && existsSync(join(outDir, item.file))) {
        done.push(prev);
        totals.skip++;
        continue;
      }
      const cached = byHash.get(item.hash); // dedupe dalam satu run
      let bytes: Buffer;
      try {
        bytes = cached ?? (await ttsQuestSynth(item.text, item.speaker_id));
      } catch (err) {
        console.log(`  ❌ ${lesson.id}/${item.file}: ${(err as Error).message.slice(0, 120)}`);
        failed.push(`${lesson.id}/${item.file}`);
        continue;
      }
      if (!cached) byHash.set(item.hash, bytes);
      writeFileSync(join(outDir, item.file), bytes);
      done.push({ ...item, speaker_name: undefined });
      totals.synth++;
      regenerated++;
      console.log(`  🔊 ${lesson.id}/${item.file} ← ${item.text} (${bytes.length} B)`);
    }

    const manifest: Manifest = {
      unit: lesson.id,
      generated_at: new Date().toISOString(),
      engine: "ttsquest-voicevox",
      items: done,
    };
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    console.log(
      `📦 ${lesson.id}: ${regenerated} baru, ${plan.length - regenerated} cache · ${done.length} file total\n`,
    );
  }

  console.log(
    `\n✅ Selesai — ${totals.synth} disintesis, ${totals.skip} dari cache. Total unik: ${byHash.size}.`,
  );
  if (failed.length > 0) {
    console.error(`\n⚠️  ${failed.length} gagal (jaringan/engine):\n  - ${failed.join("\n  - ")}`);
    console.error("   Jalankan ulang perintah yang sama untuk melanjutkan.");
    process.exitCode = 1;
  }

  if (markReady.length > 0) {
    console.log(`\n🏷️  Tandai audio_status=ready: ${markReady.join(", ")}`);
    for (const unit of markReady) {
      const path = join(lessonsDir, `${unit}.json`);
      if (!existsSync(path)) {
        console.error(`  ❌ ${unit}: file pelajaran tidak ada`);
        process.exitCode = 1;
        continue;
      }
      const mfPath = join(audioRoot, unit, "manifest.json");
      if (!existsSync(mfPath)) {
        console.error(`  ❌ ${unit}: manifest audio belum ada — generate dulu`);
        process.exitCode = 1;
        continue;
      }
      const raw = JSON.parse(readFileSync(path, "utf8"));
      const lesson = lessonSchema.parse(raw);
      const expected = planUnit(lesson).length;
      const mf = JSON.parse(readFileSync(mfPath, "utf8")) as Manifest;
      if (mf.items.length !== expected) {
        console.error(`  ❌ ${unit}: manifest ${mf.items.length}/${expected} file — lengkapi dulu`);
        process.exitCode = 1;
        continue;
      }
      raw.audio_status = "ready";
      writeFileSync(path, JSON.stringify(raw, null, 2) + "\n");
      console.log(`  ✅ ${unit} → ready`);
    }
    console.log("\n⚠️  Jangan lupa: npm run content:validate lalu commit hasilnya.");
  }
}

function safeParse(s: string): Manifest | null {
  try {
    return JSON.parse(s) as Manifest;
  } catch {
    return null;
  }
}

main().catch((err) => {
  console.error("\n❌", err);
  process.exit(1);
});
