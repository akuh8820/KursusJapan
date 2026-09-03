# Spec: bunpo-partikel-area

- **Module id:** `bunpo-partikel-area`
- **Inisiatif:** B
- **Depends on:** `partikel-data`

## Objective

Rekonstruksi area dashboard "Bunpō & Partikel" yang menggabungkan (a) pola grammar dari semua unit (saat ini di `/bunpo`) dan (b) koleksi partikel dari `content/particles.json`, dengan tab/navigation antara "Bunpō" dan "Partikel", **detail**, serta mendukung **latihan ringan partikel#n** per unit yang dipakai modul `materi-prune`/`gating-prereq` (kuis partikel yang muncul di unit n, tandai done).

Keberhasilan = halaman `/bunpo` menampilkan daftar pola + daftar partikel + detail masing-masing; menyediakan latihan partikel#n (dan bunpo#n) yang sinkron dgn progres per-unit gating.

## Tech Stack & Konteks

- Next.js 16 static export, React 19, TS, Tailwind 4.
- Pola server → client props (jangan import `store.ts` dari client).
- Data: `listLessonsLocal()` (server) untuk grammar; `loadParticles()` (server) utk partikel.
- Progress disimpan di `src/lib/progress/store.ts` (IndexedDB) — format flag area didefinisikan `gating-prereq`.

## Commands

```bash
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js src
node --import tsx -e "..."   # smoke: render data masuk?
# build/deploy via CI
```

## Project Structure

```
src/app/bunpo/page.tsx            → server: ambil lessons + particles, pass ke client
src/app/bunpo/bunpo-client.tsx    → client: tab Bunpō | Partikel, daftar + detail + kuis ringan + tombol selesai
```

(Tetap di route `/bunpo` dari F2; tanpa route baru.) Gunakan kembali komponen JpAudioButton utk audio (koordinasi `audio-fix`).

## Code Style

- Tab/segmented control berlabel "Bunpō" dan "Partikel".
- Bunpō: daftar pola (pattern + meaning + unit), detail (formation, contoh + 🔊).
- Partikel: daftar partikel (char, romaji, fungsi, unit_ids), detail (contoh jp/romaji/id).
- Latihan #n: utk unit `n`, daftar partikel dengan `unit_ids` memuat `n5-u00n` → mini-kuis (benar/salah memilih fungsi/arti) → tandai `practice_done.partikel` utk unit n.
- Bunpō #n: verifikasi pola `lesson.grammar` unit n → tandai `practice_done.bunpo` utk unit n.
- Gaya UI: Tailwind card, `text-primary` (`#b91c1c`), `text-muted`, bahasa Indonesia.

## Testing Strategy

- Verifikasi manual: tab bunpō & partikel, detail, latihan partikel#n & bunpo#n menulis mark; sinkron dgn gating ujian.
- typecheck + lint.

## Boundaries

- **Always:** server → client props; loader server-only; gunakan `unitAudioUrl`.
- **Ask first:** mengubah route URL area; menambah jenis payload progress baru.
- **Never:** memanggil `store.ts` di client; menyentuh `kurasi`.

## Success Criteria

- [ ] Tab Bunpō & Partikel berfungsi dan data tampil.
- [ ] Partikel dari `content/particles.json` terlihat (bukan hardcode), incl. `unit_ids`.
- [ ] Detail contoh + 🔊 audio benar (sesuai `audio-fix`).
- [ ] Latihan bunpo#n & partikel#n menulis `practice_done` utk unit yg sesuai.
- [ ] Typecheck exit 0, lint exit 0.

## Open Questions

- URL route final (`/bunpo` vs `/bunpo-partikel`) — asumsi tetap `/bunpo`.