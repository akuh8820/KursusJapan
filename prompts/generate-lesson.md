# Template Generate Pelajaran (AI → Kurasi → Gate)

Bagian dari pipeline konten PRD §9.1:

```
Generate (AI) → Kurasi manual → Quality gate → Publish
```

## Cara pakai

1. Salin prompt di bawah ke AI, isi bagian `[...]`.
2. Simpan hasil sebagai `content/lessons/n5-u0XX.json`.
3. Jalankan `npm run content:validate` — perbaiki sampai semua ✅.
4. **Kurasi manusia wajib**: cek akurasi grammar vs referensi standar
   (Genki/Minna no Nihongo), naturalitas kalimat, dan kualitas arti
   Bahasa Indonesia. Tandai `audio_status: "ready"` hanya setelah audio
   dikurasi.
5. Jalankan `npm run content:publish`.

## Prompt

```text
Kamu adalah penulis kurikulum bahasa Jepang untuk pemula absolut Indonesia
(persona: pekerja/mahasiswa muda yang akan hidup di Jepang).

Buat SATU pelajaran JSON sesuai skema berikut:
- id: n5-u0XX, unit_no: XX, level: N5
- theme: [TEMA KEHIDUPAN NYATA, mis. "Naik kereta pertama kali"]
- dialog: ≥6 baris percakapan alami bertema itu; setiap baris punya
  jp (dengan kanji), kana (bacaan penuh hiragana/katakana), romaji
  (Hepburn, huruf latin saja), id (arti Bahasa Indonesia yang enak dibaca)
- grammar: tepat 1 pola N5 dasar + ≥2 contoh kalimat (jp, romaji, id)
- vocab: 8–12 kata inti dari dialog; setiap kata punya contoh kalimat
- writing: 3–5 huruf hiragana berikutnya dalam urutan gojūon
- exercises: ≥4 soal mencakup SEMUA tipe: listen_choose (indeks baris
  dialog), arrange (susun kalimat), write_recall (tulis kana)
- audio_status: "pending"

Aturan mutlak:
- Semua penjelasan & arti dalam Bahasa Indonesia natural, bukan bahasa
  mesin.
- Romaji hanya huruf latin + tanda baca sederhana.
- Kalimat contoh harus natural seperti buku Minna no Nihongo / Genki,
  bukan terjemahan kata-per-kata.
- Output HANYA JSON valid tanpa penjelasan tambahan.
```
