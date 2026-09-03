# Spec: partikel-data

- **Module id:** `partikel-data`
- **Inisiatif:** B
- **Depends on:** —

## Objective

Sediakan koleksi partikel JLPT N5 sebagai konten baru (`content/particles.json`) + schema Zod, supaya latihan ringan **partikel#n** (per unit) di area Bunpō & Partikel punya data yang diketertools. Tiap unit `n` memetakan ke satu set partikel yang relevan.

Keberhasilan = file `content/particles.json` valid, loader Zod bisa membacanya, dan menyediakan partikel N5 (は, が, を, に, で, へ, と, も, から, より, まで, の, ね, よ, か, dll) dengan fungsi/arti, contoh, dan **relasi unit**.

## Tech Stack & Konteks

- Next.js 16, TypeScript, Zod (`src/lib/content/schema.ts`).
- Pola konten ada: `content/lessons/*.json`, `content/conjugations.json`, `content/daily-cards.json`, loader di `src/lib/content/`.
- Loader partikel → **server-only** (jangan panggil dari client). Client menerima via props.

## Commands

```bash
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js src
node --import tsx -e "..."   # smoke check: muat partikel + validasi Zod
npm run content:validate
```

## Project Structure

```
content/particles.json              → konten baru (data)
src/lib/content/schema.ts           → tambah particleSchema + tipe Particle
src/lib/content/particles.ts        → loader server-only loadParticles()
docs/specs/SPEC-partikel-data.md    → ini
```

## Code Style

Format ringkas mengikuti `conjugations.json`, dengan `id` kebab-case dan **daftar `unit_ids`** tempat partikel muncul (untuk latihan partikel#n).

```json
{
  "version": 1,
  "particles": [
    {
      "id": "wa",
      "char": "は",
      "romaji": "wa",
      "function_id": "penanda topik",
      "example_jp": "わたしはがくせいです。",
      "example_romaji": "Watashi wa gakusei desu.",
      "example_id": "Saya seorang pelajar.",
      "unit_ids": ["n5-u001", "n5-u002"]
    }
  ]
}
```

Schema:

```ts
export const particleSchema = z.object({
  id: z.string(),                    // kebab-case, mis "wa", "ga", "o"
  char: z.string().min(1),           // karakter partikel
  romaji: z.string(),
  function_id: z.string(),           // penanda topik, penanda subjek, dst
  example_jp: z.string(),
  example_romaji: z.string(),
  example_id: z.string(),
  unit_ids: z.array(z.string()).min(1),  // unit tempat partikel muncul (utk latihan #n)
});
export type Particle = z.infer<typeof particleSchema>;
```

> Catatan: latihan partikel#n = partikel yang `unit_ids`-nya mengandung `n5-u00n`. Jika suatu unit tidak punya partikel baru, latihan #n bisa memakai partikel dari unit sebelumnya atau meminta batas min partikel per unit (lihat Open Questions). Ini bekerja sama dengan gating; jangan sampai sebuah unit terkunci karena tak punya partikel.

## Testing Strategy

- Smoke check: `loadParticles()` → valid Zod, non-empty.
- Verify bahwa setiap unit `n5-u001..030` memetakan ke ≥1 partikel (fungsi helper `particlesForUnit(unitId)`).
- Quality gate bila loader ditambahkan ke `content:validate`.

## Boundaries

- **Always:** loader server-only; `particles.json` valid; contoh gramatikal natural.
- **Ask first:** menambah partikel di luar N5; mengubah `version`.
- **Never:** mengubah file lesson JSON; men-commit partikel yang belum dikurasi artinya.

## Success Criteria

- [ ] `content/particles.json` dibuat dan tervalidasi Zod.
- [ ] Loader `loadParticles()` server-only tersedia.
- [ ] Setiap unit memetakan ke ≥1 partikel (helper `particlesForUnit`).
- [ ] Partikel N5 utama ada (min. 10), masing-masing punya char, romaji, fungsi, contoh, unit_ids.
- [ ] `content:validate` lolos.
- [ ] typecheck exit 0, lint exit 0.

## Open Questions

- Fallback utk unit tanpa partikel baru (draft: reuse partikel unit sebelumnya atau atur min per unit saat kurasi).