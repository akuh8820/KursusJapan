/**
 * Konvensi nama & URL audio pelajaran (dihasilkan scripts/generate-audio.ts).
 * Static export GitHub Pages memakai basePath (mis. "/go-japan") — tag
 * <audio> manual tidak di-prefix otomatis oleh Next, jadi selalu lewat
 * unitAudioUrl().
 */

export function dialogFile(i: number): string {
  return `d${String(i).padStart(2, "0")}.mp3`;
}

export function vocabFile(i: number, kind: "t" | "x"): string {
  return `v${String(i).padStart(2, "0")}${kind}.mp3`;
}

export function unitAudioUrl(unit: string, file: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${base}/audio/${unit}/${file}`;
}
