# Fasih 🇯🇵

> Aplikasi belajar bahasa Jepang standar JLPT — gratis, multi-indra, dengan ritme Pomodoro 20+5. Dibuat untuk orang Indonesia yang cita-citanya hidup di Jepang.

[![Deploy ke GitHub Pages](https://github.com/akuh8820/KursusJapan/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/akuh8820/KursusJapan/actions/workflows/deploy-pages.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-TBD-lightgrey)

🌐 **Coba sekarang:** [akuh8820.github.io/KursusJapan](https://akuh8820.github.io/KursusJapan/) · 100% gratis, tanpa akun.

🧪 **Masa beta terbuka** — 10 unit N5 pertama + audio aktif. Menemukan masalah atau punya ide? [Lapor di sini](https://github.com/akuh8820/KursusJapan/issues/new/choose).

---

## Tentang

Metode kursus online umum gagal di satu titik: **konsistensi**. Fasih membaliknya —

1. **Ritme ditentukan aplikasi, bukan niat baik.** Satu hari = satu siklus Pomodoro **20 menit fokus + 5 menit rehat**, lengkap dengan mode fokus bebas gangguan dan aturan jeda maksimal 1×.
2. **Multi-indra sejak hari pertama** — dengar (audio), lihat (teks & furigana), tulis (huruf Jepang), uji (latihan interaktif).
3. **JLPT sebagai penggaris kemajuan** N5 → N1, tapi positioning-nya bukan sekadar ujian: bahasa sebagai alat untuk hidup mandiri di Jepang.

## Fitur

| Fitur | Keterangan |
|---|---|
| ⏱️ Siklus Pomodoro 20+5 | Mode fokus tanpa iklan & notifikasi, rehat wajib penuh untuk streak |
| 🔥 Streak harian | Bertambah hanya jika siklus penuh selesai; maksimal +1 per hari (JST) |
| 📚 Pelajaran multi-indra | Dialog, kosakata + contoh, tata bahasa, huruf, latihan interaktif |
| 🃏 Kartu Kata/Fakta hari ini | Konten segar tiap hari, berganti otomatis per tanggal JST |
| ✅ Latihan interaktif | Dengar-pilih (audio VOICEVOX), susun kalimat & tulis kana |
| 📊 Analytics | Taksonomi event siap PostHog — terpasang sejak hari pertama |

## Status Pengembangan

| Fase | Cakupan | Status |
|---|---|---|
| **F0 — Fondasi** | Infra web, pipeline konten end-to-end, sesi Pomodoro, analytics | ✅ Selesai |
| F1 — MVP Web | 60 pelajaran N5, audio TTS, SRS, trace goresan KanjiVG | 🚧 Berjalan |
| F1.5 — Polish | Akun cloud, push notification, iterasi soft launch | ⏳ |
| F2 — Android | Port Play Store + widget home screen | ⏳ |

## Teknologi

[Next.js 16](https://nextjs.org) (static export) · React 19 · TypeScript · Tailwind CSS 4 · [Zod](https://zod.dev) (skema konten) · Supabase (Postgres + RLS, menyusul) · PostHog (analytics) · GitHub Pages + Actions (CI/CD)

## Struktur Proyek

```
├── src/
│   ├── app/
│   │   ├── page.tsx              # dashboard (kartu harian, streak, daftar unit)
│   │   └── sesi/[unit]/          # sesi interaktif Pomodoro 20+5
│   ├── components/               # komponen client (kartu harian, streak)
│   └── lib/
│       ├── content/              # skema Zod, quality gate, akses data
│       ├── session/              # logika streak harian (JST)
│       └── analytics/            # taksonomi event + provider PostHog
├── content/
│   ├── lessons/                  # pelajaran JSON (sumber kebenaran)
│   └── daily-cards.json          # seed kartu Kata/Fakta hari ini
├── public/audio/                 # audio VOICEVOX per unit + manifest (hasil generate)
├── supabase/migrations/          # skema DB awal + Row Level Security
├── scripts/                      # CLI pipeline konten & audio + smoke test render
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
- Goresan kanji memakai dataset standar [KanjiVG](https://kanjivg.tagaini.net).

## Deployment

Deploy otomatis via GitHub Actions setiap push ke `main`:
lint → typecheck → quality gate konten → static export → GitHub Pages.

Konfigurasi build memakai `output: "export"` dengan `basePath` yang mengikuti nama repository secara dinamis, sehingga aman terhadap rename repo.

---

<div align="center">

**Fasih** — 20 menit sehari, dengar–lihat–tulis, menuju hidupmu di Jepang. 🗾

</div>
