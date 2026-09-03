# Spec: canvas-contrast

- **Module id:** `canvas-contrast`
- **Inisiatif:** A
- **Depends on:** —

## Objective

Perbaiki kontras goresan (ink) dan shadow stylus di komponen `KanjiCanvas` agar terlihat jelas baik di mode terang maupun gelap. Issue #2 (judul "Canvas") melaporkan antara lain: *"Perbaikan kontras dan ketebalan agar dark mode tidak menghalangi canvas"*.

Keberhasilan = goresan tangan terlihat jelas di kedua mode, shadow huruf target tetap samar namun terbaca, dan tidak ada ambiguitas "huruf yang digambar" vs "shadow yang dijiplak".

## Tech Stack & Konteks

- `src/components/kanji-canvas.tsx` — komponen `"use client"`, pakai Canvas 2D native + Pointer Events, backdrop Tailwind.
- Saat ini:
  - **Ink** (goresan user): `ctx.strokeStyle = "#1c1917"` (line 116) — hampir hitam pekat, **tidak terlihat di dark mode** (background kartu gelap).
  - **Shadow** (huruf target): `rgba(100, 100, 100, 0.35)` (line 102) — samar, sulit dibaca di dark mode.
- Tidak ada dependency tambahan.

## Commands

```bash
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js src
# build/deploy via CI GitHub Actions
```

## Project Structure

```
src/components/kanji-canvas.tsx   → satu-satunya file yang diubah
```

## Code Style

Gunakan variabel CSS yang sudah ada agar warnanya tema-aware (baca `src/app/globals.css` untuk token: foreground, muted, primary dll). Contoh pendekatan:

```ts
// Ink: pakai warna foreground (terlihat di light & dark)
const inkColor = getCssVar("--foreground", "#1c1917");

// Shadow: neutral, cukup kontras utk kedua mode
const shadowColor = getCssVar("--foreground", "#000")  // dengan opacity via globalAlpha
```

Hindari hardcode tunggal yang hanya cocok satu mode. Naikkan ketebalan minimal yang nyaman: ink `lineWidth` sekitar 8–12, shadow tipis (contoh 2) agar tetap beda lapisan.

## Testing Strategy

- Verifikasi manual di browser: mode terang + gelap untuk karakter hiragana, katakana, & kanji.
- Pastikan shadow tetap tampak sebagai "bayangan instruksi", bukan terlihat seperti goresan user.
- typecheck + lint lolos.

## Boundaries

- **Always:** ink dan shadow harus terlihat di light & dark. Jangan ubah behavior pointer/undo/clear & penilaian manual (Mirip ✓ / Ulangi ⟳).
- **Ask first:** menarik dependency/plugin baru, mengubah prop/API `KanjiCanvas`.
- **Never:** ubah logika data stroke atau `getStrokeData`; sentuh file lain di luar komponen ini tanpa task tersendiri.

## Success Criteria

- [ ] Goresan tangan ({ink}) terlihat jelas saat menggambar di kedua mode.
- [ ] Shadow huruf target terbaca samar dan jelas sebagai panduan di kedua mode.
- [ ] Kontras default (tanpa mode gelap aktivasi manual apa pun) tidak menimpa tampilan.
- [ ] Tidak ada perubahan pada perilaku penilaian manual.
- [ ] Typecheck exit 0, lint exit 0.
- [ ] Verifikasi manual di browser (light + dark), termasuk kanji.

## Open Questions

- Tidak ada yang menahan eksekusi. Nilai toleransi warna bisa disetel saat implementasi mengikuti token `globals.css`.