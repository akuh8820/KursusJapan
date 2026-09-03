# Spec: grammar-rename

- **Module id:** `grammar-rename`
- **Inisiatif:** B
- **Depends on:** — (dapat tumpang tindih dgn materi-prune/dashboard-restructure, dicek saat impl)

## Objective

Konsistenkan istilah **"grammar" → "bunpo"** agar output UI dan kode selaras dengan label area (tester menganggap materi "absurd"; istilah pinjam bahasa Inggris dihindari). Lingkup sesuai pilihan user: **"rekonstruksi ulang"** — samakan label dan penamaan yang tampak publik.

**Catatan penting:** berdasarkan jawaban user utk area & materi, keputusan besar yang dipakai adalah:
- Konten belajar (grammar/bunpo, partikel, dll) **pindah dari sesi ke dashboard** (`materi-prune`, `bunpo-partikel-area`).
- Nama field `grammar` di schema & konten lesson JSON **TIDAK** diubah ke `bunpo` bila itu berarti migrasi konten berisiko dan tidak memberi nilai fungsional; rename difokuskan pada **label UI & navigasi**. (Keputusan final perlu konfirmasi impl: user memilih "rekonstruksi ulang" untuk istilah pinjaman — kita menetapkan **rename label + varian publik**, bukan rename field schema.)

Keberhasilan = tidak ada label "Grammar"/"grammar" yang terlihat user di UI publik; pengganti "Bunpō"/"bunpo" konsisten di sesi, dashboard, area.

## Tech Stack & Konteks

- UI teks di `session-client.tsx`, `bunpo-client.tsx`, `dashboard-client.tsx`, `materi-client.tsx`.
- Schema/comments bisa tetap `grammar` (internal) selama tidak tampil pengguna.

## Commands

```bash
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js src
# deploy via CI
```

## Project Structure

```
src/app/sesi/session-client.tsx      → label tahap "Bunpō" (sudah via prune; cek)
src/app/bunpo/bunpo-client.tsx       → sudah "Bunpō"
src/app/_components/dashboard-client.tsx → hub label "Bunpō & Partikel"
src/app/materi/materi-client.tsx     → cek istilah
```

## Code Style

- Gunakan "Bunpō" di judul/tab; gutter dingin untuk detail tetap "bunpo" internal.

## Testing Strategy

- Verifikasi manual: tak ada teks "Grammar" di UI (browser).
- typecheck + lint.

## Boundaries

- **Always:** jangan ubah `grammar` field schema/konten kecuali ditugaskan (avoid migrasi berisiko).
- **Ask first:** rename field schema/konten (beri nilai & biaya).
- **Never:** merombak konten lesson utk rename saja.

## Success Criteria

- [ ] Tidak ada label "Grammar" publik.
- [ ] "Bunpō & Partikel" konsisten di dashboard & area.
- [ ] Typecheck exit 0, lint exit 0.

## Open Questions

- Apakah istilah "grammar" di contoh kalimat/prompt kurasi perlu diganti "bunpo" (asumsi tidak — prompt belajar, bukan label).