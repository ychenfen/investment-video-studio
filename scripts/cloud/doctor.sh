#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BRIEF=0
[[ "${1:-}" == "--brief" ]] && BRIEF=1
FAIL=0

check_cmd() {
  local name="$1"
  if command -v "$name" >/dev/null 2>&1; then
    [[ "$BRIEF" == 1 ]] || printf 'OK   %-12s %s\n' "$name" "$(command -v "$name")"
  else
    printf 'MISS %-12s required\n' "$name" >&2
    FAIL=1
  fi
}

for cmd in node npm python3 ffmpeg ffprobe git; do check_cmd "$cmd"; done

PYTHON="python3"
[[ -x "$ROOT/.venv-cloud/bin/python" ]] && PYTHON="$ROOT/.venv-cloud/bin/python"

if "$PYTHON" -c 'import edge_tts,numpy,soundfile' >/dev/null 2>&1; then
  [[ "$BRIEF" == 1 ]] || echo "OK   python libs  edge_tts numpy soundfile"
else
  echo "MISS python libs  run: $PYTHON -m pip install -r scripts/cloud/requirements.txt" >&2
  FAIL=1
fi

if [[ -x "$ROOT/remotion/node_modules/.bin/remotion" ]]; then
  [[ "$BRIEF" == 1 ]] || echo "OK   remotion     local CLI installed"
else
  echo "MISS remotion     run npm ci in remotion/" >&2
  FAIL=1
fi

if command -v fc-match >/dev/null 2>&1; then
  FONT="$(fc-match 'Noto Sans CJK SC' 2>/dev/null | head -1)"
  if [[ "$FONT" == *"NotoSansCJK"* || "$FONT" == *"Noto Sans CJK"* ]]; then
    [[ "$BRIEF" == 1 ]] || echo "OK   CJK font     $FONT"
  else
    echo "WARN CJK font     Noto Sans CJK SC not confirmed" >&2
  fi
else
  echo "WARN fontconfig   install fonts-noto-cjk in the cloud environment" >&2
fi

if [[ "$FAIL" == 0 ]]; then
  echo "cloud doctor: PASS"
else
  echo "cloud doctor: FAIL" >&2
fi
exit "$FAIL"
