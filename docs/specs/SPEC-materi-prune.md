# Spec: materi-prune

- **Module id:** `materi-prune`
- **Inisiatif:** B
- **Depends on:** `reading-data`, `gating-prereq`

## Objective

Pangkas sesi/Materi (`src/app/sesi/[unit]/`) menjadi **alur ujian berbasis kuis pilihan ganda**, didahului latihan ringan per-unit. Sesuai petunjuk user:

> "Semua konten kecuali kana keluar dari Materi (ke dashboard). Konten materi hanya berisikan pilihan ganda dengan soal cerita, percakapan yang belum rampung, dan lain sebagainya dengan bahasa campuran (kana, kanji, romaji)."

Tiap unit `n`:
1. **Latihan ringan #n** — 3 modul kecil terpisah (kanji#n jiplak dari `lesson.writing`, bunpo#n dari `lesson.grammar`, partikel#n dari `particles.json`). Selesai → buka **Ujian #n**.
2. **Ujian #n** — soal pilihan ganda **campuran** unit n dari `content/reading.json` (story + gapped_dialog), bahasa campuran. **Wajib 100% benar** → buka latihan ringan #(n+1).

Keberhasilan = route `sesi/[unit]` menjalankan alur latihan→ujian per-unit dengan gating lockstep (modul `gating-prereq`).

## Tech Stack & Konteks

- `session-client.tsx` saat ini = mesin 6 tahap; di-refactor.
- Konten belajar (grammar/kosakata/huruf/kaiwa) **pindah ke area dashboard** (`dashboard-restructure`, `bunpo-partikel-area`, `reading-area`, `kaiwa`).
- `progress/store.ts` menyimpan status per-unit (via `gating-prereq`).

## Commands

```bash
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js src
# build/deploy via CI
```

## Project Structure

```
src/app/sesi/[unit]/page.tsx        → server: load reading + lessons → filter by unit → pass props
src/app/sesi/session-client.tsx     → refactor: flow latihan ringan #n (3 modul) → ujian #n (MC campuran) → lulus 100%
src/lib/content/reading.ts          → loader utk filter unit_id
src/app/huruf/huruf-client.tsx      → modul latihan kanji#n (koordinasi)
src/app/bunpo/bunpo-client.tsx      → modul latihan bunpo#n + partikel#n (koordinasi)
```

## Code Style

- `session-client` jadi kompeten: header unit n, step latihan ringan (kanji/bunpo/partikel), lalu "Ujian #n".
- Ujian = daftar MC (story/gapped_dialog); pilih → benar/salah; progress; **langkh lulus hanya saat 100% benar**; retry bebas kalau belum 100%.
- Tampilkan status kunci prasyarat utk unit berikutnya (dari `gating-prereq`).
- Bahasa Indonesia; Tailwind card konsisten.

## Testing Strategy

- Manual: sesi unit → latihan ringan → ujian; gagal <100% → retry; 100% → unlock berikutnya.
- typecheck + lint.

## Boundaries

- **Always:** konten belajar tak lagi di sesi; sesi = latihan ringan + ujian.
- **Ask first:** mempertahankan tahap dialog penuh di sesi (konten dipindah dashboard).
- **Never:** menyentuh `kurasi`; menghapus `store.ts`/progress API.

## Success Criteria

- [ ] Sesi `[unit]` menampilkan latihan ringan #n (kanji+bunpo+partikel) → ujian #n.
- [ ] Ujian #n = soal MC campuran (story + gapped_dialog) unit n, bahasa campuran.
- [ ] Lulus hanya saat 100% benar; retry bebas.
- [ ] Gating lockstep per-unit aktif (modul `gating-prereq`).
- [ ] Typecheck exit 0, lint exit 0.

## Open Questions

- Jumlah soal minimum per ujian #n (draft: ≥1 story + ≥1 gapped_dialog).