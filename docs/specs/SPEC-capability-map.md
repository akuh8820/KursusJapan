# Capability Map: Fix Issue #1/#2 + Restrukturisasi Go Japan

> Status: **DRAFT — menunggu review & approval human** sebelum module spec ditulis lebih lanjut dan implementasi dimulai.

## Ringkasan

Dua inisiatif independen. **Inisiatif A** memperbaiki dua bug yang dilaporkan pengguna (issue #1 audio, issue #2 canvas). **Inisiatif B** merestrukturisasi produk: memangkas sesi/Materi menjadi kuis pilihan ganda saja, memindahkan semua konten belajar ke area dashboard, dan mengunci Materi dengan prasyarat (kana/kanji, bunpo, partikel).

## Module map

| Module id | Responsibility | Depends on | Inisiatif |
|---|---|---|---|
| `audio-fix` | Perbaiki pemilihan index file audio di area pages (kamus/bunpo/kaiwa) + sesi grammar agar suara sesuai teks | — | A |
| `canvas-contrast` | Ink + shadow stylus terlihat jelas di mode terang & gelap | — | A |
| `partikel-data` | Koleksi partikel JLPT N5 (konten baru) `content/particles.json` + schema | — | B |
| `reading-data` | Soal cerita + percakapan-belum-rampung (kuis MC, bahasa campuran) `content/reading.json` + schema | — | B |
| `bunpo-partikel-area` | Area dashboard gabungan "Bunpō & Partikel" (daftar + detail + kuis ringan) | partikel-data | B |
| `reading-area` | Area dashboard "Latihan Baca" (kumpulan soal cerita) | reading-data | B |
| `materi-prune` | Sesi `[unit]` jadi **Ujian #n**: kuis MC campuran unit n (dari reading.json), wajib 100% untuk buka latihan berikutnya; didahului latihan ringan #n | reading-data | B |
| `dashboard-restructure` | Portal 6 area, pindah konten belajar dari sesi ke area dashboard | bunpo-partikel-area, reading-area | B |
| `audio-gen` | Generate TTS: 20 unit baru (u011–u030) + 60 contoh grammar `g*.mp3` + kurasi telinga + set `ready` | — | B |
| `grammar-rename` | Konsistenkan istilah "grammar" → "bunpo" (label UI saja, field schema tetap `grammar`) | — | B |
| `gating-prereq` | **Lockstep berjenjang per-unit**: ujian #n terkunci sampai latihan ringan #n (kanji+bunpo+partikel) selesai; ujian #n lolos 100% → buka latihan #n+1 | partikel-data, materia-prune, dashboard-restructure | B |

## Dependency direction

- `bunpo-partikel-area → partikel-data`
- `reading-area → reading-data`
- `materi-prune → reading-data`
- `dashboard-restructure → bunpo-partikel-area, reading-area`
- `gating-prereq → bunpo-partikel-area, materi-prune, dashboard-restructure, audio-gen`

Tidak ada cycle. `gating-prereq` adalah modul terakhir pada Inisiatif B.

## Build order

```
INISIATIF A (dulu, paralel antar-module):
  audio-fix   ‖   canvas-contrast

INISIATIF B (setelah A, sekuensial mengikuti dependensi):
  partikel-data, reading-data
  → bunpo-partikel-area, reading-area
  → audio-gen  (paralel dengan redesign area/UI; hanya perlu selesai sebelum gating-prereq merampungkan)
  → materi-prune, dashboard-restructure
  → grammar-rename
  → gating-prereq
```

## Model gating (per-unit, lockstep berjenjang)

Setiap unit `n` (1..30) punya **identitas angka** untuk bunpō#n, kanji#n, partikel#n.

1. **Latihan ringan #n** = 3 modul kecil terpisah: kanji#n (jiplak kanji dari `lesson.writing` unit n), bunpō#n (baca+verifikasi `lesson.grammar` unit n), partikel#n (kuis partikel yang muncul di unit n).
2. Latihan ringan #n **selesai** → buka **Ujian #n** (soal MC campuran unit n dari `reading.json`).
3. Ujian #n **100% benar** → buka **Latihan ringan #n+1** → dan seterusnya sampai unit 30.

Tidak ada "overstudy": user hanya menguasai materi unit n sebelum ujian n.

Progress disimpan per-unit di `src/lib/progress/store.ts` (IndexedDB); ujian bisa diulang bebas sampai 100% (lulus tidak mengunci selamanya, retry diperbolehkan).

> `audio-gen` dapat berjalan paralel dengan desain area dashboard karena tidak bersandiwara file. `grammar-rename` dapat tumpang tindih dengan `materi-prune` dan `dashboard-restructure` sebagian, tapi dicek ulang saat implementasi.

## Kontrak antar-module

- **Konten partikel & reading** hidup di file konten baru (`content/particles.json`, `content/reading.json`) + schema Zod di `src/lib/content/schema.ts`. Interface pembacaan dipakai oleh `bunpo-partikel-area`, `reading-area`, dan `materi-prune` → kontrak didefinisikan di `SPEC-partikel-data.md` & `SPEC-reading-data.md`.
- **Progress prasyarat** disimpan via `src/lib/progress/store.ts` (IndexedDB). Format mark per area didefinisikan di `SPEC-gating-prereq.md`, dikonsumsi oleh `dashboard-restructure` & `materi-prune`.
- **Audio**: konvensi nama file `g<NN>.mp3` untuk contoh grammar ditambahkan; `unitAudioUrl()` sudah ada dan wajib dipakai (basePath GitHub Pages). Gate `audioReady` dipakai semua area.

## Modul yang TIDAK boleh diubah

- `src/app/kurasi/` (internal curator tool)
- `src/lib/content/quality-gate.ts` (jangan dipecah tanpa task tersendiri)
- `.env`, secret, key (tidak pernah di-commit)