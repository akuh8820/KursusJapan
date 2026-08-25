# Fasih (nama kerja) — F0 Fondasi

App kursus bahasa Jepang standar JLPT, gratis, multi-indra.
PRD: `../docs/prd-app-kursus-bahasa-jepang.md` · Catatan sesi: `../docs/sesi-2026-08-25.md`

## Isi F0 (fase ini)

| Komponen | Lokasi |
|---|---|
| Skema DB awal (users, lessons, SRS queue, pomodoro, dll) | `supabase/migrations/0001_init.sql` |
| Skema konten pelajaran (Zod, sumber tunggal) | `src/lib/content/schema.ts` |
| Quality gate "Jelas, Berbobot, Efektif" | `src/lib/content/quality-gate.ts` |
| Pipeline konten: validate & publish CLI | `scripts/` + `npm run content:*` |
| Template prompt generator pelajaran AI | `prompts/generate-lesson.md` |
| 10 pelajaran pilot N5 (u001–u010) | `content/lessons/` |
| Kartu Kata/Fakta hari ini (seed 7 hari) | `content/daily-cards.json` |
| Taksonomi event analytics (PostHog-ready) | `src/lib/analytics/` |
| Dashboard + kartu harian (shell web v1) | `src/app/page.tsx` |
| Sesi interaktif Pomodoro 20+5 (fokus, jeda 1×, rehat, streak lokal) | `src/app/sesi/` + `src/lib/session/streak.ts` |

## Menjalankan

```bash
npm install
npm run dev            # dashboard di http://localhost:3000
                       # sesi Pomodoro di http://localhost:3000/sesi/n5-u001

# Pipeline konten:
npm run content:validate   # quality gate struktural semua pelajaran
npm run content:publish    # dry-run tanpa env; upsert ke Supabase bila env terisi
```

## Deploy: GitHub Pages (static export)

App di-export statis (`output: "export"` di `next.config.ts`) dan dideploy
otomatis oleh GitHub Actions ke `https://akuh8820.github.io/KursusJapan/`.

- Workflow: `.github/workflows/deploy-pages.yml` — jalan tiap push ke `main`
  (lint → typecheck → quality gate → build → deploy).
- `basePath` diambil otomatis dari nama repo (`github.event.repository.name`)
  saat build CI, jadi aman kalau repo di-rename.
- Konten pelajaran & kartu harian di-bake saat build; kartu hari ini tetap
  berganti per tanggal JST karena dipilih client-side.
- Konsekuensi static export: tidak ada server runtime. Bila nanti Supabase
  aktif, app membaca lewat client-side + anon key + RLS; publish pipeline
  tetap dijalankan lokal.

## Menghubungkan Supabase

1. Buat project di supabase.com → Settings → API.
2. `cp .env.example .env.local`, isi URL & key.
3. Terapkan skema: tempel isi `supabase/migrations/0001_init.sql` ke
   SQL Editor (atau pasang Supabase CLI → `supabase db push`).
4. Publish konten pilot: `npm run content:publish`.
5. Analytics: isi `NEXT_PUBLIC_POSTHOG_KEY` — event otomatis aktif.

## Aturan main (jangan dilanggar)

- Publish pelajaran **wajib** lolos `content:validate` + kurasi manusia.
- Iklan hanya boleh di: fase rehat, footer dashboard, bawah kartu harian (PRD §10).
- Kanji untuk fitur trace memakai dataset KanjiVG (`kanjivg_id`), bukan goresan bebas.
