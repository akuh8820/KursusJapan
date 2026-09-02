/**
 * Vendor data stroke huruf Jepang untuk shadow stylus / canvas.
 *
 * Sumber:
 *  - Kana (hiragana/katakana): strokesvg (zhengkyl/strokesvg) — dist/hiragana, dist/katakana
 *  - Kanji: KanjiVG (KanjiVG/kanjivg) — kanji/{hex}.svg (raw GitHub)
 *
 * Output: public/data/stroke/{unicode-hex}.json
 *   { char, source: "kana"|"kanji", viewBox, strokes: [{i, d}] }
 *
 * Jalankan: node --import tsx scripts/vendor-stroke.ts
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const outDir = join(root, "public", "data", "stroke");
const kanaSrc = "/data/data/com.termux/files/usr/tmp/opencode/stroke/strokesvg/dist";

// Karakter yang dipakai konten (dari writing semua unit)
const KANA = ["あ","い","う","え","お","か","き","く","け","こ","さ","し","す","せ","そ","た","ち","つ","て","と","な","に","ぬ","ね","の","は","ひ","ふ","へ","ほ","ま","み","む","め","も","や","ゆ","よ","ん","ら","り","る","れ","ろ","わ","を","ア","イ","ウ","エ","オ","サ","シ","ス","セ","ソ","ナ","ニ","ヌ","ネ","ノ","マ","ミ","ム","メ","モ"];
const KANJI = ["電","話","番","号","銀","行","残","高","屋","根","直","危","天","気","雨","雪","走","健","康","勝","祭","温","泉","花","面","接","時","給","誕","生","選","約","心","配","自","信","大","学","院","続"];

function isHiragana(c: string): boolean {
  const cp = c.codePointAt(0)!;
  return cp >= 0x3040 && cp <= 0x309f;
}

function hex(c: string): string {
  return c.codePointAt(0)!.toString(16).padStart(5, "0");
}

function parseKana(svg: string): { i: number; d: string }[] {
  const m = svg.match(/<g data-strokesvg="strokes"[^>]*>([\s\S]*?)<\/g>/);
  if (!m) return [];
  const parts = m[1].split(/style="--i:(\d+)"/).slice(1);
  const strokes: { i: number; d: string }[] = [];
  for (let k = 0; k < parts.length; k += 2) {
    const idx = +parts[k];
    const block = parts[k + 1];
    const ds = [...block.matchAll(/d="([^"]*)"/g)].map((x) => x[1]);
    strokes[idx] = { i: idx, d: ds.join(" ") };
  }
  return strokes.filter(Boolean);
}

function parseKanji(svg: string): { i: number; d: string }[] {
  // Ambil path dengan data path nyata (d mulai M/m), bukan referensi kvg:####-sN
  const strokes: { i: number; d: string }[] = [];
  const re = /<path[^>]*d="(M[^"]*)"/g;
  let mm;
  let i = 0;
  while ((mm = re.exec(svg))) {
    strokes.push({ i: i++, d: mm[1] });
  }
  return strokes;
}

mkdirSync(outDir, { recursive: true });
let ok = 0, fail = 0;

for (const c of KANA) {
  const dir = isHiragana(c) ? "hiragana" : "katakana";
  const file = join(kanaSrc, dir, `${c}.svg`);
  if (!existsSync(file)) { console.log("MISSING kana:", c); fail++; continue; }
  const svg = readFileSync(file, "utf8");
  const strokes = parseKana(svg);
  if (strokes.length === 0) { console.log("NO STROKES kana:", c); fail++; continue; }
  const data = { char: c, source: "kana", viewBox: "0 0 1024 1024", strokes };
  writeFileSync(join(outDir, `${hex(c)}.json`), JSON.stringify(data));
  ok++;
}

for (const c of KANJI) {
  const h = hex(c);
  const file = join("/data/data/com.termux/files/usr/tmp/opencode/stroke", `${h}.svg`);
  if (!existsSync(file)) { console.log("MISSING kanji file:", c, h); fail++; continue; }
  const svg = readFileSync(file, "utf8");
  const strokes = parseKanji(svg);
  if (strokes.length === 0) { console.log("NO STROKES kanji:", c); fail++; continue; }
  const data = { char: c, source: "kanji", viewBox: "0 0 109 109", strokes };
  writeFileSync(join(outDir, `${h}.json`), JSON.stringify(data));
  ok++;
}

console.log(`Done: ${ok} ok, ${fail} fail. Output: ${outDir}`);