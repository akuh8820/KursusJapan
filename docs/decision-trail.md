# Jejak Keputusan — Fix Issue + Restrukturisasi Go Japan

Dokumen ini mencatat keputusan yang telah dikunci bersama user, agar setiap
implementasi punya jejak yang dapat ditelusuri kembali. Sumber kebenaran teknis
per-module ada di `docs/specs/SPEC-*.md` dan urutan build di `tasks/plan.md`.

## Konteks
- Repo: `akuh8820/KursusJapan`, branch `main`, app "Go Japan".
- 2 issue GitHub terbuka: #1 "Bug" (audio tidak sesuai teks), #2 "Canvas"
  (goresan tidak sesuai huruf + kontras dark mode).
- Restrukturisasi besar: pangkas sesi/Materi jadi kuis pilihan ganda campuran,
  pindahkan konten belajar ke dashboard, terapkan gating prasyarat lockstep.

## Keputusan terkunci (via sesi tanya-jawab)
1. **Jumlah unit = 30** (sesuai repo).
2. **Model gating = lockstep berjenjang per-unit**: latihan ringan #n
   (kanji+bunpo+partikel, 3 modul terpisah) selesai → buka **Ujian #n**;
   ujian #n **100% benar** → buka latihan #(n+1); dst hingga 30.
3. **Ujian #n = soal MC campuran** unit n dari `reading.json` (satu soal
   memakai kanji+bunpo+partikel sekaligus, bukan 1 konsep per soal).
4. **Threshold lulus ujian = 100%, retry bebas** (gagal → bisa ulang, tidak
   mengunci selamanya).
5. **Grammar→bunpo = rename label UI saja**; field schema/konten TETAP
   `grammar` (hindari migrasi 30 JSON berisiko).
6. **audio-gen** = generate TTS semua: audio 20 unit baru (u011-030) + 60
   contoh grammar `g<NN>.mp3` + kurasi telinga + set ready.
7. **Konten partikel & soal baca** = buat konten baru
   (`content/particles.json`, `content/reading.json`).
8. **Prioritas kerja** = fix 2 issue dulu (Inisiatif A), lalu restrukturisasi
   (Inisiatif B).
9. **Prasyarat** = hanya kanji+bunpo+partikel (kaiwa/kamus/kosakata/reading-area
   TIDAK mengunci; area belajar bebas tidak tergating).

## Keputusan tambahan — referensi Minna no Nihongo (2026-09-03)
Sumber: https://www.minnanihongo.com/ (kursus "Minna no Nihongo", 50 lessons N5-N4).

- **Urutan 30 unit Go Japan dipertahankan** (tidak rearrange, tidak rename
  folder audio, tidak gating ulang). Tema unit Go Japan sudah bercermin topik
  Minna (u1 salam=Minna L1, u3 belanja=L3, u5 これ/あれ=L2-5, u7 waktu=L4,
  u8 keluarga=L11, dst).
- **Minna dipakai sebagai referensi isi**, untuk:
  1. **Soal ujian #n** (`reading.json`) — kosakata & pola percakapan bertema
     Minna per unit.
  2. **Latihan partikel** (`particles.json`) — pilih partikel yang muncul di
     unit tsb.
  3. **Perkaya tema/dialog per unit** — validasi, bukan menulis ulang habis.
  4. **Referensi tingkat/urutan** — panduan jenjang N5 (です/ます → bentuk →
     pasif N4).

## Catatan teknis penting
- **Jebakan Turbopack**: jangan panggil `src/lib/content/store.ts` (pakai
  `node:fs`/`process.cwd()`) dari komponen `"use client"` — bangkrut build.
  Data harus di-pass server component → client props. `export const metadata`
  TIDAK boleh dari client.
- **Root cause audio (terbukti)**: `kamus-client.tsx:139,151` hardcode
  `vocabFile(1,"t"/"x")` (selalu index 1); `bunpo-client.tsx:90`
  `vocabFile(idx+1,"x")` untuk contoh grammar (grammar TIDAK punya file audio
  sendiri — hanya `d*.mp3` + `v*[tx].mp3` di disk); sesi `session-client.tsx:304`
  `g${i}.mp3` → 404 (file tak ada); area pages menampilkan 🔊 untuk semua 30
  unit padahal hanya u001-010 `audio_status==="ready"`.
- **Root cause canvas**: `kanji-canvas.tsx:116` ink `#1c1917` (hampir hitam) →
  tak terlihat di dark mode; `:102` shadow `rgba(100,100,100,0.35)` → samar.
  Issue "a vs b" tidak bisa diverifikasi dari screenshot (salah halaman —
  dashboard lama, bukan canvas); kemungkinan ink tak terlihat di dark sehingga
  user hanya lihat shadow.

## Urutan build (Inisiatif A → B)
A1 (audio-fix + canvas-contrast) → B1 (partikel-data, reading-data) →
B2 (bunpo-partikel-area, reading-area) → B3 (audio-gen) →
B4 (materi-prune, dashboard-restructure) → B5 (grammar-rename, gating-prereq).
File `session-client.tsx`/`bunpo-client.tsx` dijaminkan berurutan (bukan paralel).