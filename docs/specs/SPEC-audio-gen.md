# Spec: audio-gen

- **Module id:** `audio-gen`
- **Inisiatif:** B
- **Depends on:** —

## Objective

Perluas pipeline TTS agar audio tersedia untuk **semua 30 unit** dan untuk **contoh grammar** (`g<NN>.mp3`). Saat ini hanya 10 unit (u001–u010) yang `audio_status === "ready"`; 20 unit sisanya (u011–u030) belum punya file audio, dan contoh grammar tak pernah dibangkitkan.

Keberhasilan = file `audio/<unit>/g<NN>.mp3`, `d<NN>.mp3`, `v<NN><t|x>.mp3` lengkap utk 30 unit; `audio_status` di-set `ready` setelah **kurasi telinga manusia**; area pages & sesi bisa mengambil audio yang cocok (koordinasi `audio-fix`).

## Tech Stack & Konteks

- Pipeline: `scripts/generate-audio.ts` (VOICEVOX, backend gratis api.tts.quest, idempoten). Dua tokoh dialog bersuara beda.
- Konvensi: `src/lib/content/audio-paths.ts` — `dialogFile`, `vocabFile`; perlu tambahan helper `grammarFile(i)` → `g<NN>.mp3` bila dipakai sesi/bunpo.
- Jumlah estimasi: ~791 file dialog+vocab (30 unit) + 60 contoh grammar.
- Diperlukan disk & rate-limit VOICEVOX; jalankan bertahap.

## Commands

```bash
node --import tsx scripts/generate-audio.ts <unit> ...   # generate per unit / batch
node --import tsx scripts/generate-audio.ts --mark-ready <unit>
node node_modules/typescript/bin/tsc --noEmit
# deploy via CI
```

## Project Structure

```
scripts/generate-audio.ts      → tambah: grammar example → g<NN>.mp3
public/audio/<unit>/*.mp3      → file hasil generate
src/lib/content/audio-paths.ts → (opsional) helper grammarFile()
public/audio/<unit>/manifest.json → diperbarui
```

## Code Style

- Ulangi pola generate dialog/vocab yang ada utk grammar contoh.
- `--mark-ready` hanya dijalankan setelah kurasi telinga (ukuran/ambil sandi).
- Pertahankan idempotensi (skip file yang sudah ada).

## Testing Strategy

- Verifikasi file `g<NN>.mp3` ada di disk utk unit ready.
- Verifikasi `manifest.json` memuat item baru.
- Smoke: `unitAudioUrl(unit, grammarFile(i))` mengarah file yang ada.
- typecheck + lint.

## Boundaries

- **Always:** jangan generate tanpa kebutuhan; `--mark-ready` setelah telinga manusia.
- **Ask first:** menambah backend TTS lain; mengubah speaker/engine.
- **Never:** men-commit audio yang belum dikurasi; mengubah audio unit ready tanpa task.

## Success Criteria

- [ ] 20 unit (u011–u030) punya file audio lengkap (dialog + vocab) & `ready`.
- [ ] 60 contoh grammar punya `g<NN>.mp3`.
- [ ] `audio_status` "ready" utk 30 unit setelah kurasi.
- [ ] Area pages & sesi memakai audio yang benar (via `audio-fix`).
- [ ] typecheck exit 0, lint exit 0.

## Open Questions

- Waktu/kuota TTS (jalankan batch). Apakah audio utk 20 unit dikurasi sekarang (besar) atau bertahap.