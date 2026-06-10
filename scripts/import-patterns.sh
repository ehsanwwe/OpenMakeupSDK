#!/usr/bin/env bash
# Download makeup pattern textures into assets/patterns/<type>/<id>.png
# Usage: ./scripts/import-patterns.sh [urls-file]
#   urls-file: TSV lines "<source_url>\t<target_path>"
#   default:   .import/patterns-urls.txt
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
URLS="${1:-$ROOT/.import/patterns-urls.txt}"
[ -f "$URLS" ] || { echo "urls file not found: $URLS"; exit 1; }
ok=0; fail=0
while IFS=$'\t' read -r url target; do
  [ -z "${url:-}" ] && continue
  out="$ROOT/$target"; mkdir -p "$(dirname "$out")"
  if curl -fsSL "$url" -o "$out"; then echo "ok   $target"; ok=$((ok+1));
  else echo "FAIL $target  ($url)"; fail=$((fail+1)); fi
done < "$URLS"
echo "done: $ok downloaded, $fail failed"
