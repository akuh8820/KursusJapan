# Plan: Fix Issue #1/#2 + Restrukturisasi Go Japan

> Berdasarkan `docs/specs/SPEC-capability-map.md`. Batch modul; tiap modul punya spec sendiri di `docs/specs/`.
> Wajib dev gate setelah tiap batch: `tsc --noEmit` + `eslint src` lolos, lalu CI deploy.

## Build order

### INISIATIF A — fix 2 issue yang dilaporkan (dulu)

**Batch A1 (paralel, file beda):**
- `audio-fix` — perbaiki index audio di kamus/bunpo/kaiwa + gate audioReady.
- `canvas-contrast` — kontras ink+shadow dark/light.

### INISIATIF B — restrukturisasi

**Batch B1 — data konten baru (paralel):**
- `partikel-data` → `content/particles.json` + schema + loader.
- `reading-data` → `content/reading.json` + schema + loader.

**Batch B2 — area dashboard (paralel, bergantung B1):**
- `bunpo-partikel-area` — `/bunpo` jadi gabungan Bunpō + Partikel.
- `reading-area` — `/reading` (Latihan Baca).

**Batch B3 — audio (bergantung none, paralel dgn B2/B4):**
- `audio-gen` — TTS utk 20 unit baru + 60 contoh grammar + mark ready + kurasi.

**Batch B4 — pangkas sesi + rework dashboard:**
- `materi-prune` — sesi `[unit]` → kuis MC saja (memakai `reading-data`).
- `dashboard-restructure` — portal 6 hub + rework `/materi` daftar.

**Batch B5 — konsistensi & gating:**
- `grammar-rename` — label publik "Bunpō"; harmonisasi (field schema tetap `grammar`).
- `gating-prereq` — **lockstep per-unit**: latihan ringan #n (kanji+bunpo+partikel) → ujian #n → 100% → latihan #n+1.

> Order B4 sebelum B5: `gating-prereq` memakassar `materi-prune` selesai. `dashboard-restructure` sedia port untuk `gating-prereq`.

## Parallel / sequential

- **Paralel (file disjoint):** A1 dua module; B1 dua module; B2 dua module; B3 bebas paralel.
- **Sequential:** B2 tunggu B1; B4 tunggu B2+B1 (butuh reading/particles); B5 tunggu B4+B2.
- Risiko konflik write: `session-client.tsx` disentuh `materi-prune`, `grammar-rename`, `gating-prereq` → **jangan paralel modul tersebut bersama-sama; kerjakan berurutan.** Sama utk `bunpo-client.tsx` (`bunpo-partikel-area`, `audio-fix`, `gating-prereq`, `grammar-rename`).
  → Recommended: satukan kerjakan per-lane alias `bunpo` + `sesi` + `dashboard` (satu dispatcher) utk menghindari tabrakan.

## Dependencies file (kontrak)

- `src/lib/progress/store.ts` → gating (B5).
- `src/lib/content/schema.ts` → partikel (B1), reading (B1).
- `src/lib/content/audio-paths.ts` → helper `grammarFile()` (B3/B1).
- `src/app/page.tsx`, `dashboard-client.tsx` → hub (B4).

## Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| Audio-gen besar (~851 file, kuota TTS) | Batch per unit; `--mark-ready` setelah kurasi; jalankan paralel dgn B2/B4 |
| Rename label vs field (migrasi konten) | Rename hanya UI publik; field schema/konten tetap `grammar` (keputusan user) |
| Konflik write di `session-client.tsx` / `bunpo-client.tsx` | Satukan modul berbagi file dalam satu lane berurutan |
| Gating IndexedDB flash di client | State/loading saat baca progress; gate di `session-client` sebelum render kuis |
| Unit tanpa partikel baru | `partikel-data` fallback/reuse atau min per unit saat kurasi; jangan sampai unit terkunci tanpa partikel |

## Checkpoints verifikasi

1. **Setelah A1** — typecheck+lint; browser kamus/bunpo/kaiwa 🔊 benar; canvas terlihat dark & light. (commit `fix-2-issue`)
2. **Setelah B1** — `content:validate` lolos; loader partikel/reading terbaca.
3. **Setelah B2** — `/bunpo` tab partikel, `/reading` kuis. typecheck+lint.
4. **Setelah B3** — file audio 30 unit + grammar ada; ready.
5. **Setelah B4** — sesi = kuis MC; dashboard 6 hub.
6. **Setelah B5** — gating berfungsi end-to-end (IndexedDB persist).

## Definition of Done (keseluruhan)

- Semua spec criteria tercapai.
- typecheck exit 0, lint exit 0, `content:validate` lolos.
- CI deploy hijau; verifikasi browser (light+dark, desktop+mobile-ish Termux browser) semua area.
- Public working tree bersih; README/docs spec di-commit.