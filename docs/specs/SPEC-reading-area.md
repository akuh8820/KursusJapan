# Spec: reading-area

- **Module id:** `reading-area`
- **Inisiatif:** B
- **Depends on:** `reading-data`

## Objective

Buat area dashboard "Latihan Baca" (`/reading`) yang menampilkan kumpulan soal story & gapped_dialog dari `content/reading.json`, agar user berlatih pemahaman bahasa campuran (kana/kanji/romaji) **secara bebas** — area ini TIDAK mengunci ujian Materi (yang dikunci adalah latihan ringan per-unit via `gating-prereq`).

Keberhasilan = halaman `/reading` terhubung dari portal dashboard, menampilkan daftar soal, dan memberikan kuis MC per soal dengan umpan balik benar/salah — latihan bebas, tidak terhubung ke gating Materi.

## Tech Stack & Konteks

- Next.js 16 static export, React 19, TS, Tailwind 4.
- Pola server → client props.
- Data: `loadReading()` (server-only).

## Commands

```bash
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js src
# build/deploy via CI
```

## Project Structure

```
src/app/reading/page.tsx          → server: loadReading() → pass ke client
src/app/reading/reading-client.tsx → client: daftar + kuis MC per item
src/app/page.tsx                  → dashboard: tambahkan card "Latihan Baca" (koordinasi dashboard-restructure)
```

## Code Style

- Pola `MX-Auto w-full max-w-md px-4 pb-16 pt-8`.
- Daftar item (`story` / `gapped_dialog`), klik → tampilkan prompt (jp + romaji + id), lalu pilihan MC (A/B/C/D).
- Setelah pilih → umpan balik benar/salah + tombol "Soal Berikutnya".
- Bahasa UI Indonesia.

## Testing Strategy

- Verifikasi manual: daftar soal, pilih jawaban, umpan balik, navigasi.
- Pastikan `answer_index` memberi benar/salah yang tepat.
- typecheck + lint.

## Boundaries

- **Always:** server → client; render via data reading; jangan hardcode konten.
- **Ask first:** menambah jenis soal; mengubah route.
- **Never:** memanggil `store.ts` di client; menyentuh `kurasi`.

## Success Criteria

- [ ] `/reading` terpasang di dashboard portal.
- [ ] Item dari `content/reading.json` tampil.
- [ ] Kuis MC berfungsi dgn umpan balik benar/salah.
- [ ] Prompts memakai bahasa campuran (kana/kanji/romaji).
- [ ] Typecheck exit 0, lint exit 0.

## Open Questions

- Urutan soal: by unit vs acak — asumsi acak/berurutan sesuai file.