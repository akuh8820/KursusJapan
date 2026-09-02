# Go Japan 🇯🇵

> Aplikasi belajar bahasa Jepang standar JLPT — gratis, multi-indra, tanpa akun. Dibuat untuk orang Indonesia yang cita-citanya hidup di Jepang.

[![Deploy ke GitHub Pages](https://github.com/akuh8820/KursusJapan/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/akuh8820/KursusJapan/actions/workflows/deploy-pages.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-TBD-lightgrey)

🌐 **Coba sekarang:** [akuh8820.github.io/KursusJapan](https://akuh8820.github.io/KursusJapan/) · 100% gratis, tanpa akun.

🧪 **Masa beta terbuka** — 30 unit N5 + audio aktif. Menemukan masalah atau punya ide? [Lapor di sini](https://github.com/akuh8820/KursusJapan/issues/new/choose).

---

## Tentang

Metode kursus online umum gagal di satu titik: **konsistensi**. Go Japan membaliknya —

1. **Ritme ditentukan aplikasi, bukan niat baik.** Satu hari = satu siklus **20 menit fokus + 5 menit rehat**, lengkap dengan mode fokus bebas gangguan.
2. **Multi-indra sejak hari pertama** — dengar (audio), lihat (teks & furigana), tulis (canvas gambar huruf), uji (latihan interaktif).
3. **JLPT sebagai penggaris kemajuan** N5 → N1, tapi positioning-nya bukan sekadar ujian: bahasa sebagai alat untuk hidup mandiri di Jepang.

## Fitur

| Fitur | Keterangan |
|---|---|
| 🗂️ **Portal 5 area** | Dashboard hub: Huruf/Kana, Bunpō (tata bahasa), Kaiwa (percakapan), Materi (unit JLPT), Kamus |
| ✍️ **Canvas gambar huruf** | Latihan menulis hiragana/katakana/kanji dengan jari + **shadow stylus** (skeleton huruf untuk dijiplak), penilaian manual |
| 📚 **30 unit N5** | Dialog, kosakata + contoh, tata bahasa, huruf, latihan — **semua terbuka** (tanpa kunci) |
| 🎧 **Audio VOICEVOX** | Dialog & kosakata per unit, dua tokoh bersuara berbeda, tombol 🔊 di semua elemen |
| 🔁 **Sesi 6 tahap** | Dialog → Grammar → Kosakata → Huruf → Latihan → Kuis akhiran (wajib lolos) |
| 📖 **Kamus + konjugasi** | 290 kosakata semua unit, bisa dicari, + konjugasi kata kerja & adjektiva |
| 🃏 **Kartu Kata/Fakta hari ini** | Konten segar tiap hari, berganti otomatis per tanggal JST |
| 🔁 **SRS Leitner** | 5 kotak pengulangan berjarak + halaman `/ulasan` |
| 📊 **Analytics** | Taksonomi event siap PostHog — terpasang sejak hari pertama |

## Status Pengembangan

| Fase | Cakupan | Status |
|---|---|---|
| **F0 — Fondasi** | Infra web, pipeline konten end-to-end, sesi, analytics | ✅ Selesai |
| **F1 — MVP Web** | 30 unit N5, audio TTS, SRS, PWA offline, dark mode | ✅ Selesai |
| **F2 — PRD v2** | Canvas gambar huruf + shadow stylus, portal 5 area, kamus + konjugasi, semua konten terbuka | ✅ Selesai |
| F3 — Polish | Akun cloud, push notification, iterasi soft launch | ⏳ |
| F4 — Android | Port Play Store + widget home screen | ⏳ |

## Teknologi

[Next.js 16](https://nextjs.org) (static export) · React 19 · TypeScript · Tailwind CSS 4 · [Zod](https://zod.dev) (skema konten) · Supabase (Postgres + RLS, menyusul) · PostHog (analytics) · GitHub Pages + Actions (CI/CD)

## Struktur Proyek

```
├── src/
│   ├── app/
│   │   ├── page.tsx              # dashboard — portal 5 area
│   │   ├── huruf/                # area Huruf/Kana (grid + latihan menulis)
│   │   ├── bunpo/                # area tata bahasa
│   │   ├── kaiwa/                # area percakapan
│   │   ├── materi/               # area unit JLPT (semua terbuka)
│   │   ├── kamus/                # area kamus + konjugasi
│   │   ├── sesi/[unit]/          # sesi 6 tahap
│   │   └── ulasan/               # SRS Leitner
│   ├── components/
│   │   ├── kanji-canvas.tsx      # canvas gambar huruf + shadow stylus
│   │   └── exercises/            # komponen latihan
│   └── lib/
│       ├── content/              # skema Zod, quality gate, akses data
│       ├── stroke/               # parser & render stroke SVG → canvas
│       ├── progress/             # SRS & progres (IndexedDB)
│       └── analytics/            # taksonomi event + provider PostHog
├── content/
│   ├── lessons/                  # pelajaran JSON (sumber kebenaran)
│   ├── conjugations.json         # konjugasi kata kerja & adjektiva
│   └── daily-cards.json          # seed kartu Kata/Fakta hari ini
├── public/
│   ├── audio/                    # audio VOICEVOX per unit + manifest
│   └── data/stroke/              # data goresan kana + kanji (KanjiVG/strokesvg)
├── scripts/                      # CLI pipeline konten & audio + vendor stroke
├── prompts/                      # template prompt generator pelajaran (AI)
└── .github/workflows/            # CI/CD deploy GitHub Pages
```

## Menjalankan Lokal

```bash
npm install
npm run dev        # http://localhost:3000
```

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build static export ke `out/` |
| `npm run lint` / `typecheck` | Pemeriksaan kualitas kode |
| `npm run content:validate` | Quality gate struktural semua pelajaran |
| `npm run content:publish` | Publish konten ke Supabase (dry-run tanpa env) |
| `npm run audio:generate` | Generate audio pelajaran via VOICEVOX (idempoten, bisa di-rerun) |

> **Catatan Termux:** `npm run build` tidak bisa jalan di Termux (SWC binary tidak ada untuk android/arm64). Build & deploy dilakukan via CI GitHub Actions.

## Pipeline Konten

Kualitas materi adalah janji utama produk, jadi produksinya lewat gerbang bertingkat:

```
Generate (AI)  →  Kurasi manusia  →  Quality gate  →  Publish
(dialog, vocab      (akurasi grammar    ("Jelas, Berbobot,   (versi +
 soal, TTS)         vs Genki/Minna,     Efektif")            changelog)
                    naturalitas arti)
```

- Setiap pelajaran tervalidasi skema Zod (`src/lib/content/schema.ts`) — satu sumber kebenaran untuk generator, quality gate, publisher, dan tampilan app.
- Pelajaran **wajib** lolos kurasi manusia sebelum berstatus published.
- Kurasi manusia memakai halaman `/kurasi` (internal): verdict per bagian
  (dialog/grammar/kosakata/huruf/latihan) + catatan revisi, tersimpan di
  browser, bisa diekspor JSON untuk arsip keputusan.
- **Audio** dihasilkan [VOICEVOX](https://voicevox.hiroshiba.jp) — dua tokoh
  dialog punya suara berbeda. Generate via `npm run audio:generate`
  (backend gratis api.tts.quest; idempoten). Status `ready` baru diset lewat
  `npm run audio:generate -- --mark-ready <unit>` **setelah** kurasi telinga
  manusia — barulah tombol 🔊 & soal dengar muncul di sesi belajar.
- **Data goresan huruf** di-vendor ke repo (`public/data/stroke/`): kana dari
  [strokesvg](https://github.com/zhengkyl/strokesvg), kanji dari
  [KanjiVG](https://kanjivg.tagaini.net) (CC BY-SA 3.0). Regenerasi via
  `npm run vendor:stroke`.

## Deployment

Deploy otomatis via GitHub Actions setiap push ke `main`:
lint → typecheck → quality gate konten → static export → GitHub Pages.

Konfigurasi build memakai `output: "export"` dengan `basePath` yang mengikuti nama repository secara dinamis, sehingga aman terhadap rename repo.

---

<div align="center">

**Go Japan** — 20 menit sehari, dengar–lihat–tulis, menuju hidupmu di Jepang. 🗾

</div>