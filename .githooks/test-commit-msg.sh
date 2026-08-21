#!/usr/bin/env bash
# Self-check: commit-msg hook strips Cursor credit, keeps human co-authors.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK="$ROOT/.githooks/commit-msg"
fail=0

run_case() {
  local name="$1" input="$2" expect="$3"
  local f
  f="$(mktemp)"
  printf '%s' "$input" >"$f"
  bash "$HOOK" "$f"
  local got
  got="$(cat "$f")"
  rm -f "$f"
  if [[ "$got" != "$expect" ]]; then
    echo "FAIL $name"
    echo "  expected: $(printf '%q' "$expect")"
    echo "  got:      $(printf '%q' "$got")"
    fail=1
  else
    echo "ok $name"
  fi
}

run_case strip-cursor \
  $'fix: thing\n\nCo-authored-by: Cursor <cursoragent@cursor.com>\n' \
  $'fix: thing'

run_case keep-human \
  $'fix: thing\n\nCo-authored-by: Ada <ada@example.com>\n' \
  $'fix: thing\n\nCo-authored-by: Ada <ada@example.com>'

run_case strip-made-with \
  $'feat: x\n\nMade-with: Cursor\n' \
  $'feat: x'

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi
echo "all commit-msg checks passed"
