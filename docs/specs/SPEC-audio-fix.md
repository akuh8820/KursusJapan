# Spec: audio-fix

- **Module id:** `audio-fix`
- **Inisiatif:** A
- **Depends on:** —
- **Feature branch / plan:** lihat `tasks/plan.md`

## Objective

Perbaiki pemilihan file audio di semua area agar **suara selalu sesuai tekstet**. Issue #1 (belum diberi nomor oleh user, judul "Bug") melaporkan: *"Suara tidak sesuai dengan teks — Bunpo, Kaiwa, Kamus, Materi (mungkin)"*.

Keberhasilan = setiap tombol 🔊 memutar audio yang benar-benar cocok dengan teks yang ditampilkan, di area kamus, bunpo, kaiwa, dan sesi; tidak ada tombol 🔊 yang memutar file kosong / index salah / 404.

## Tech Stack & Konteks

- Next.js 16 static export, React 19, TypeScript, Tailwind 4, alias `@/` → `src/`.
- Konvensi file audio: `src/lib/content/audio-paths.ts` memilik `dialogFile(i)` → `d<NN>.mp3`, `vocabFile(i, kind)` → `v<NN><t|x>.mp3`, `unitAudioUrl(unit, file)` → `<basePath>/audio/<unit>/<file>`. `basePath` = `process.env.NEXT_PUBLIC_BASE_PATH` (GitHub Pages).
- Status audio per unit: `lesson.audio_status === "ready"` — baru 10 unit (u001–u010) yang ready.
- Area pages adalah pola **server → client props** (jangan import `store.ts` dari client).

## Commands

```bash
node node_modules/typescript/bin/tsc --noEmit     # typecheck (wajib lolos)
node node_modules/eslint/bin/eslint.js src        # lint (wajib lolos)
npm run content:validate                          # quality gate konten (berlaku utk inisiatif B)
# build & deploy: via CI GitHub Actions (tidak bisa lokal di Termux/SWC arm64)
```

## Project Structure

```
src/lib/content/audio-paths.ts     → konvensi nama & URL audio (existing, jangan ubah API)
src/app/kamus/page.tsx             → server: sisipkan vocabIdx saat flatMap vocab
src/app/kamus/kamus-client.tsx     → client: gunakan vocabFile(vocabIdx, ...)
src/app/bunpo/bunpo-client.tsx     → client: perbaiki index contoh grammar (lihat catatan)
src/app/kaiwa/kaiwa-client.tsx     → client: gate 🔊 by audioReady + lokasi benar
src/app/sesi/session-client.tsx    → client: perbaiki `g<NN>.mp3` (koordinasi dgn audio-gen)
```

## Code Style

Ikuti pola komponen yang sudah ada (Tailwind card, `text-primary` merah `#b91c1c`, `text-muted`, `rounded-2xl border border-border bg-card`). Bahasa UI: Indonesia.

Contoh — memakai index yang benar:

```tsx
<JpAudioButton
  src={unitAudioUrl(selectedVocab.unitId, vocabFile(vocabIdx, "t"))}
  label={selectedVocab.term}
/>
```

Contoh — gate audio oleh status ready:

```tsx
{audioReady && <JpAudioButton src={...} label={...} small />}
```

## Testing Strategy

- Verifikasi manual di browser (light + dark) per area: kamus, bunpo, kaiwa.
- Verifikasi: tombol 🔊 pada unit yang audio-nya **belum ready** (u011+) tidak muncul.
- Typecheck + eslint lokal; build/deploy via CI.

## Boundaries

- **Always:** gunakan `unitAudioUrl()` (bukan hardcode path). Pass `audio_status` dari server ke client. Typecheck+lint lolos sebelum commit.
- **Ask first:** menambah `g<NN>.mp3` / mengubah konvensi nama file audio (berkoordinasi `audio-gen`). Mengubah struktur `VocabItem`/schema.
- **Never:** men-commit secret; mengubah `audio-paths.ts` API publik; menyentuh `src/app/kurasi/`.

## Success Criteria

- [ ] Kamus: setiap kata memutar file vocab yang benar (index sesuai urutan `vocab` di lesson), bukan hardcode `vocabFile(1,...)`.
- [ ] Bunpō & sesi grammar: contoh grammar memutar file `g<NN>.mp3` yang benar setelah `audio-gen` menyediakan; sebelum itu tidak ada tombol 🔊 yang memutar file salah/404.
- [ ] Kaiwa: `dialogFile(idx)` sesuai baris dialog; 🔊 hanya tampil untuk unit `audioReady`.
- [ ] Tidak ada tombol 🔊 untuk unit u011–u030 sebelum audio-nya siap.
- [ ] Typecheck exit 0, lint exit 0.
- [ ] Cara kerja terverifikasi manual di browser (area kamus/bunpo/kaiwa), light & dark.

## Open Questions

- (Open dipecahkan via `audio-gen`) — apakah `g<NN>.mp3` akan dibangkitkan, dan apakah urutan contoh grammar sejalan dengan `bunpo-client` mapping `idx+1` atau `idx`.
- Apakah `vocabIdx` diurutkan sama dengan urutan `lesson.vocab` (ya, seharusnya).