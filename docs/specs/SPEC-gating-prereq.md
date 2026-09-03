# Spec: gating-prereq

- **Module id:** `gating-prereq`
- **Inisiatif:** B
- **Depends on:** `partikel-data`, `materi-prune`, `dashboard-restructure`, `bunpo-partikel-area`

## Objective

Berlakukan **lockstep berjenjang per-unit**: ujian Materi unit `n` hanya terbuka setelah latihan ringan unit `n` (kanji + bunpo + partikel) selesai; dan ujian `n` yang **lolos 100% benar** membuka latihan ringan unit `n+1`. Ini mencegah "overstudy yang tidak penting" — user hanya menguasai materi unit yang ujiannya akan mereka kerjakan.

Keberhasilan (end-to-end):
- Latihan ringan #1 (kanji + bunpo + partikel) selesai → **Ujian #1 terbuka**.
- Ujian #1 **100% benar** → **Latihan ringan #2 terbuka**.
- Begitu seterusnya hingga unit 30 (sesuai repo).

## Tech Stack & Konteks

- `src/lib/progress/store.ts` (IndexedDB): pakai `getSetting`/`setSetting` atau flag per-unit. Tambah struktur:
  ```
  {
    exam_pass: { "n5-u001": true, ... },          // ujian unit n lolos 100%
    practice_done: { "n5-u001": { kanji: true, bunpo: true, partikel: true }, ... }
  }
  ```
  Dapat disimpan via `setSetting("exam_pass", {...})` + `setSetting("practice_done", {...})` (serializable).

## Commands

```bash
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js src
# build/deploy via CI
```

## Project Structure

```
src/lib/progress/store.ts        → tambah: getExamPass/setExamPass, getPracticeDone/setPracticeDone, getUnitLock
src/app/materi/materi-client.tsx → daftar 30 unit dgn status (latihan terkunci/terbuka, ujian terkunci/terbuka/lulus)
src/app/sesi/session-client.tsx  → alur: latihan ringan #n (3 modul) → ujian #n (MC) → lulus 100% → unlock #n+1
src/app/huruf/huruf-client.tsx   → latihan kanji#n (jiplak) → tandai done
src/app/bunpo/bunpo-client.tsx   → latihan bunpo#n + partikel#n → tandai done
```

## Code Style

- Blok kunci: kartu 🔒 + pesan "Selesaikan Latihan #n (kanji, bunpo, partikel) untuk membuka Ujian #n" + tombol ke area masing-masing.
- Status bisa `locked` / `in_progress` (sebagian latihan done) / `practice_done` / `exam_locked?` / `exam_passed`.
- Hindari render flash saat baca IndexedDB (state loading).
- Bahasa Indonesia.

## Testing Strategy

- End-to-end manual:
  1. User baru → Ujian #1 terkunci; daftar unit tampil latihan #1.
  2. Selesaikan latihan kanji+bunpo+partikel #1 → Ujian #1 terbuka.
  3. Kerjakan Ujian #1 <100% → tetap terbuka (retry), belum unlock #2.
  4. Ujian #1 100% → buka Latihan #2; ujian #2 masih terkunci.
  5. Reload browser → state persisten (IndexedDB).
- typecheck + lint.

## Boundaries

- **Always:** gating tidak mengunci area belajar bebas (kaiwa/kamus/reading-area); hanya ujian Materi yang dikekang. Retry ujian bebas (tak ada solid block).
- **Ask first:** mengubah threshold dari "100%"; menambah kunci tambahan (mis. kaiwa/vocab wajib) — user eksplisit hanya kanji+bunpo+partikel.
- **Never:** menghapus/mengubah API progress yang dipakai `ulasan`/streak; menyentuh `kurasi`.

## Success Criteria

- [ ] Ujian #n hanya terbuka setelah latihan ringan #n (kanji+bunpo+partikel) selesai.
- [ ] Ujian #n lolos 100% membuka latihan ringan #n+1.
- [ ] Retry ujian yang belum 100% tetap tersedia (tidak mengunci).
- [ ] State persisten lintas reload (IndexedDB).
- [ ] Area belajar bebas (kaiwa/kamus/reading) tidak tergating.
- [ ] Typecheck exit 0, lint exit 0.

## Open Questions

- Rincian data partikel#n & sumber "partikel yang muncul di unit n" — dijawab `SPEC-partikel-data.md`.