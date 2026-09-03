# Tasks: Fix Issue + Restrukturisasi Go Japan

Urutan dependency. Tiap task ≤ ~5 file. Wajib dev gate (typecheck+lint) setelah tiap batch.

## INISIATIF A

### audio-fix
- [ ] Task: Suntik `vocabIdx` saat kamus/page.tsx flatMap vocab; pakai di kamus-client utk `vocabFile(vocabIdx,"t"/"x")`
  - Acceptance: tiap kata memutar audio vocab yg benar, bukan hardcode index 1
  - Verify: browser kamus, 2 kata beda → suara beda & sesuai teks
  - Files: `src/app/kamus/page.tsx`, `src/app/kamus/kamus-client.tsx`
- [ ] Task: Gate 🔊 di bunpo/kaiwa/kamus hanya utk unit `audioReady`; perbaiki index contoh grammar bunpo & sesi `g<NN>.mp3`
  - Acceptance: tak ada tombol 🔊 utk u011–30 sebelum audio; contoh grammar memakai file yg benar
  - Verify: browser bunpo/kaiwa/kamus (light+dark), tidak ada 404
  - Files: `src/app/bunpo/bunpo-client.tsx`, `src/app/kaiwa/kaiwa-client.tsx`, `src/app/sesi/session-client.tsx`

### canvas-contrast
- [ ] Task: Kontras ink+shadow tema-aware di kanji-canvas
  - Acceptance: goresan + shadow terlihat di light & dark; perilaku penilaian tak berubah
  - Verify: browser huruf, kanji, light+dark
  - Files: `src/components/kanji-canvas.tsx`

## INISIATIF B

### partikel-data
- [ ] Task: Buat `content/particles.json` (dgn `unit_ids`) + schema/loader + helper `particlesForUnit(unitId)`
  - Acceptance: partikel N5 utama (min 10) valid, setiap unit memetak ke ≥1 partikel, loader server-only terbaca
  - Verify: `content:validate`, smoke loader mengembalikan partikel utk tiap unit
  - Files: `content/particles.json`, `src/lib/content/schema.ts`, `src/lib/content/particles.ts`

### reading-data
- [ ] Task: Buat `content/reading.json` (soal campuran + unit_id) + schema/loader
  - Acceptance: ≥1 story + ≥1 gapped_dialog per unit, valid, bahasa campuran (kanji+kana+romaji + campur bunpo/partikel dalam satu soal)
  - Verify: `content:validate`, smoke loader
  - Files: `content/reading.json`, `src/lib/content/schema.ts`, `src/lib/content/reading.ts`

### bunpo-partikel-area
- [ ] Task: Overhaul `/bunpo` → tab Bunpō | Partikel + detail + **latihan bunpo#n & partikel#n** (per unit, tandai `practice_done`)
  - Acceptance: partikel tampil dgn unit_ids; latihan #n menulis `practice_done.{bunpo,partikel}` utk unit n
  - Verify: browser bunpo tab + latihan, mark tersimpan utk unit yg tepat
  - Files: `src/app/bunpo/page.tsx`, `src/app/bunpo/bunpo-client.tsx`

### reading-area
- [ ] Task: Buat `/reading` + kuis MC (latihan bebas, tak mengunci Materi)
  - Acceptance: item dari reading.json tampil, kuis MC benar/salah
  - Verify: browser `/reading`, pilih jawaban → umpan balik
  - Files: `src/app/reading/page.tsx`, `src/app/reading/reading-client.tsx`, `src/app/page.tsx`

### audio-gen
- [ ] Task: Tambah generate contoh grammar `g<NN>.mp3` + helper `grammarFile()`
  - Acceptance: grammar file bisa di-generate; helper tersedia
  - Verify: generate satu unit, file `g<NN>.mp3` ada
  - Files: `scripts/generate-audio.ts`, `src/lib/content/audio-paths.ts`
- [ ] Task: Generate audio utk 20 unit (u011–u030) + 60 grammar; `--mark-ready` setelah kurasi
  - Acceptance: seluruh 30 unit + grammar audio ready
  - Verify: `ls public/audio/<unit>/*.mp3`, manifest
  - Files: `public/audio/**` (generated)

### materi-prune
- [ ] Task: Refactor `session-client.tsx` → alur **latihan ringan #n (kanji+bunpo+partikel) → ujian #n (MC campuran)** utk unit itu; lulus 100% → unlock #n+1
  - Acceptance: sesi [unit] tak ada tahap dialog/grammar/kosakata/huruf detail; kuis MC campuran + retry bebas + 100% utk lanjut
  - Verify: browser sesi unit, kerjakan latihan → ujian → 100%
  - Files: `src/app/sesi/[unit]/page.tsx`, `src/app/sesi/session-client.tsx`

### dashboard-restructure
- [ ] Task: Rework dashboard → 6 hub (termasuk Latihan Baca); rework `/materi` daftar 30 unit + status lockstep
  - Acceptance: 6 kartu hub benar; materi daftar unit dgn status latihan/ujian tiap unit
  - Verify: browser dashboard + materi
  - Files: `src/app/page.tsx`, `src/app/_components/dashboard-client.tsx`, `src/app/materi/*`

### grammar-rename
- [ ] Task: Hapus label "Grammar" publik → "Bunpō"; harmonisasi istilah di UI
  - Acceptance: tak ada "Grammar" tampil; "Bunpō & Partikel" konsisten
  - Verify: grep "Grammar" di UI; browser
  - Files: `src/app/sesi/session-client.tsx`, `src/app/_components/dashboard-client.tsx`, `src/app/bunpo/*`

### gating-prereq
- [ ] Task: Progress lockstep per-unit + kunci ujian #n sampai latihan ringan #n selesai; ujian #n 100% → buka latihan #n+1
  - Acceptance: latch ringan #1 (kanji+bunpo+partikel) → ujian 1 terbuka; ujian 1 100% → latihan 2; dst hingga 30; IndexedDB persist; retry bebas
  - Verify: end-to-end browser (reset + selesaikan latihan → ujian → lanjut); reload persists
  - Files: `src/lib/progress/store.ts`, `src/app/materi/*`, `src/app/sesi/session-client.tsx`, `src/app/huruf/*`, `src/app/bunpo/*`

## Verifikasi akhir (DoD)
- [ ] tsc --noEmit exit 0, eslint src exit 0
- [ ] content:validate lolos
- [ ] CI deploy hijau; browser light+dark semua area
- [ ] README/docs spec di-commit; working tree bersih