# Spec: dashboard-restructure

- **Module id:** `dashboard-restructure`
- **Inisiatif:** B
- **Depends on:** `bunpo-partikel-area`, `reading-area`

## Objective

Rekonstruksi dashboard sehingga portal menampilkan **area belajar**, dan konten belajar (bunpo/partikel, kaiwa, kana, kamus, reading) yang tadinya bagian dari sesi kini diakses langsung dari dashboard. Materi jadi satu hub menuju kuis per-unit.

Dashboard menjadi 6 hub:

1. **Kana** (`/huruf`) — baca & tulis kana/kanji (shadow stylus). Mendukung latihan kanji#n.
2. **Bunpō & Partikel** (`/bunpo`) — pola grammar + partikel + latihan bunpo#n/partikel#n (dari `bunpo-partikel-area`).
3. **Kaiwa** (`/kaiwa`) — dialog percakapan.
4. **Kamus** (`/kamus`) — kosakata + konjugasi.
5. **Latihan Baca** (`/reading`) — soal cerita/percakapan-belum-rampung (latihan bebas).
6. **Materi** (`/materi`) — alur **latihan ringan #n → ujian #n** per unit (lockstep, dari `materi-prune` + `gating-prereq`).

Keberhasilan = dashboard punya 6 kartu hub; tidak lagi menampilkan roadmap unit linear; setiap area terhubung dan isinya lengkap.

## Tech Stack & Konteks

- `src/app/page.tsx` (server) + `src/app/_components/dashboard-client.tsx` (client).
- Pola server → client props.
- `materi`/`materi-client` → berubah jadi daftar unit dgn gating (koordinasi `materi-prune` & `gating-prereq`).

## Commands

```bash
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js src
# build/deploy via CI
```

## Project Structure

```
src/app/page.tsx                    → server: pass (lessons, dailyCards, reading summary, ...) ke client
src/app/_components/dashboard-client.tsx → 6 hub cards
src/app/materi/page.tsx + materi-client.tsx → daftar unit + status gating (per-unit)
```

## Code Style

- 6 kartu hub seperti F2, tapi: tambah "Latihan Baca"; ubah label "Bunpō (Tata Bahasa)" → "Bunpō & Partikel"; deskripsi sesuaikan bahwa Materi = kuis MC.
- Pertahankan dailyCard, feedback, footer.
- Daftar Materi: tiap unit → link kuis; tampilkan status (terkunci/prasyarat belum dipenuhi) via `gating-prereq`.

## Testing Strategy

- Verifikasi manual: 6 hub mengarah benar; klik tiap hub → halaman terisi.
- Verifikasi Materi menampilkan 30 unit dgn status gating.
- typecheck + lint.

## Boundaries

- **Always:** server → client; jangan panggil `store.ts` dari client.
- **Ask first:** mengubah route; menambah/merombak hub.
- **Never:** menyentuh `kurasi`; menghapus dailyCard/feedback.

## Success Criteria

- [ ] Dashboard menampilkan 6 hub (Kana, Bunpō & Partikel, Kaiwa, Kamus, Latihan Baca, Materi).
- [ ] Setiap hub mengarah ke route yang benar & isi terisi.
- [ ] Materi = daftar kuis per-unit, dgn status gating.
- [ ] DailyCard + feedback + footer dipertahankan.
- [ ] Typecheck exit 0, lint exit 0.

## Open Questions

- Apakah dailyCard tetap di dashboard (asumsi ya).
- Nama/ikon tiap hub final.