#!/usr/bin/env bash
# =============================================================================
# B3: Generate audio TTS untuk 20 unit (u011-u030) + contoh grammar (g<NN>.mp3)
#
# CARA PAKAI:
#   1) Generate semua unit (idempoten, resume-safe — aman di-rerun):
#        bash scripts/audio-b3.sh
#   2) Generate hanya unit tertentu (mis. u011-u015):
#        bash scripts/audio-b3.sh n5-u011 n5-u012 n5-u013 n5-u014 n5-u015
#   3) Setelah KURASI TELINGA MANUSIA (dengarkan beberapa file), tandai ready:
#        bash scripts/audio-b3.sh --mark-ready
#
# Catatan:
#   - Contoh grammar (g<NN>.mp3) otomatis ikut digenerate (sudah di planUnit).
#   - Script generate-audio.ts skip file yang sudah ada + hash sama (idempoten).
#   - Rate limit VOICEVOX ±1 req/2s → bisa berjam-jam. Jalankan bertahap bila perlu.
#   - JANGAN --mark-ready sebelum kurasi telinga. Setelah ready, jalankan
#     `npm run content:validate` lalu commit.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

UNITS=(n5-u011 n5-u012 n5-u013 n5-u014 n5-u015 n5-u016 n5-u017 n5-u018 n5-u019 n5-u020 \
       n5-u021 n5-u022 n5-u023 n5-u024 n5-u025 n5-u026 n5-u027 n5-u028 n5-u029 n5-u030)

if [[ "${1:-}" == "--mark-ready" ]]; then
  echo "🏷️  Tandai audio_status=ready untuk 20 unit (setelah kurasi telinga)..."
  node --import tsx scripts/generate-audio.ts --mark-ready "${UNITS[@]}"
  echo
  echo "⚠️  Jalankan lalu commit:"
  echo "   npm run content:validate"
  echo "   git add -A && git commit -m 'B3: audio ready u011-u030' && git push"
  exit 0
fi

if [[ $# -gt 0 ]]; then
  echo "🎙️  Generate audio untuk unit: $*"
  node --import tsx scripts/generate-audio.ts --only "$(IFS=,; echo "$*")"
else
  echo "🎙️  Generate audio untuk 20 unit (u011-u030) + contoh grammar..."
  node --import tsx scripts/generate-audio.ts --only "$(IFS=,; echo "${UNITS[*]}")"
fi

echo
echo "✅ Selesai. Cek file di public/audio/<unit>/."
echo "   Setelah kurasi telinga: bash scripts/audio-b3.sh --mark-ready"