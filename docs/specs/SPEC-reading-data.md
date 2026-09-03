# Spec: reading-data

- **Module id:** `reading-data`
- **Inisiatif:** B
- **Depends on:** —

## Objective

Sediakan konten asesmen **ujian per-unit** & percakapan-belum-rampung sebagai `content/reading.json` + schema Zod, untuk (a) area dashboard "Latihan Baca", dan (b) **Ujian #n** di Materi (sesi per-unit). Soal **campuran** — satu soal memakai kombinasi kana, kanji, bunpō, partikel sekaligus (bukan "soal 1 = kanji saja, soal 2 = bunpo saja"). Berstruktur pilihan ganda.

Keberhasilan = soal story (reading comprehension) dan gapped_dialog (percakapan-belum-rampung) valid, terbaca loader, dan bisa di-render sebagai kuis MC untuk Ujian #n per unit.

## Tech Stack & Konteks

- Next.js 16, TypeScript, Zod.
- Pola konten & loader server-only sama dengan partikel/lesson.
- Tidak ada data reading terpisah sebelumnya di repo.

## Commands

```bash
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js src
node --import tsx -e "..."   # smoke check: muat reading + validasi Zod
npm run content:validate
```

## Project Structure

```
content/reading.json                 → konten baru (data)
src/lib/content/schema.ts            → tambah readingSchema + tipe ReadingItem
src/lib/content/reading.ts           → loader server-only loadReading()
docs/specs/SPEC-reading-data.md      → ini
```

## Code Style

Dua bentuk soal (discriminated union). Bahasa campuran = teks berisi kana + kanji (+ furigana bila perlu) dan romaji sebagai bantuan.

```json
{
  "version": 1,
  "items": [
    {
      "id": "r301",
      "kind": "story",
      "unit_id": "n5-u001",
      "prompt_jp": "こんにちは。はじめまして。リアンです。インドネシアからきました。",
      "prompt_romaji": "Konnichiwa. Hajimemashite. Rian desu. Indoneshia kara kimashita.",
      "prompt_id": "Halo. Senang berjumpa. Saya Rian. Saya datang dari Indonesia.",
      "question_id": "Rian berasal dari mana?",
      "choices": ["Jepang", "Indonesia", "Korea", "Tiongkok"],
      "answer_index": 1
    },
    {
      "id": "r302",
      "kind": "gapped_dialog",
      "unit_id": "n5-u001",
      "prompt_jp": "A: たなかさんは ___ ですか。 B: はいたーです。",
      "prefix_kana": "たなかさんは",
      "prefix_romaji": "Tanaka-san wa",
      "question_id": "Partikel/elemen yang benar utk melengkapi percakapan?",
      "choices": ["せんせい", "せんせいです", "がくせい", "がくせいですか"],
      "answer_index": 0
    }
  ]
}
```

Schema:

```ts
const readingItemBase = {
  id: z.string(),
  unit_id: z.string(),
  question_id: z.string(),
  choices: z.array(z.string()).min(2),
  answer_index: z.number().int().nonnegative(),
};

export const readingItemSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("story"),
    ...readingItemBase,
    prompt_jp: z.string(),
    prompt_romaji: z.string(),
    prompt_id: z.string(),
  }),
  z.object({
    kind: z.literal("gapped_dialog"),
    ...readingItemBase,
    prompt_jp: z.string(),
    prefix_kana: z.string(),
    prefix_romaji: z.string(),
  }),
]);
```

## Testing Strategy

- Smoke check loader `loadReading()` → valid, non-empty.
- Verifikasi render kuis MC di area "Latihan Baca" & Ujian Materi (per unit).
- Validate: jawaban benar sesuai `answer_index`.

## Boundaries

- **Always:** `unit_id` merujuk lesson yang ada; `answer_index` valid; minimal 1 item `story` + 1 item `gapped_dialog` per unit (30) agar tiap Ujian #n lengkap & campur.
- **Ask first:** menambah jenis soal selain story/gapped_dialog.
- **Never:** mengubah lesson JSON; meng-commit soal yang jawabannya belum dikurasi.

## Success Criteria

- [ ] `content/reading.json` dibuat, tervalidasi Zod.
- [ ] Loader `loadReading()` server-only tersedia.
- [ ] Minimal 1 item `story` + 1 `gapped_dialog` per unit (30 unit).
- [ ] Setiap soal memakai bahasa campuran (kanji/kana/romaji) & konten campur (kanji+bunpo+partikel bersama, bukan satu konsep saja).
- [ ] `content:validate` lolos.
- [ ] typecheck exit 0, lint exit 0.

## Open Questions

- (Dijawab `SPEC-materi-prune`) jumlah soal min per Ujian #n — draft ≥1 story + ≥1 gapped_dialog.
- Apakah `answer_index` dijamin konsisten setelah sort pilihan (dikelola loader render).