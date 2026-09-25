#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
JOB_INPUT="${1:-}"
if [[ -z "$JOB_INPUT" ]]; then
  echo "用法: $0 content/jobs/<slug>" >&2
  exit 2
fi

if [[ "$JOB_INPUT" = /* ]]; then
  JOB="$JOB_INPUT"
else
  JOB="$ROOT/$JOB_INPUT"
fi
JOB="$(cd "$JOB" && pwd)"

PYTHON="python3"
[[ -x "$ROOT/.venv-cloud/bin/python" ]] && PYTHON="$ROOT/.venv-cloud/bin/python"

"$ROOT/scripts/cloud/doctor.sh"
"$PYTHON" "$ROOT/scripts/cloud/validate_job.py" "$JOB"
mkdir -p "$JOB/work" "$ROOT/output"

if [[ "${SKIP_VO:-0}" != "1" ]]; then
  if [[ -n "${TTS_ENGINE:-}" ]]; then
    "$PYTHON" "$ROOT/scripts/cloud/make_voice.py" "$JOB/project.json" "$JOB/work" --engine "$TTS_ENGINE"
  else
    "$PYTHON" "$ROOT/scripts/cloud/make_voice.py" "$JOB/project.json" "$JOB/work"
  fi
fi

[[ -s "$JOB/work/voice.wav" && -s "$JOB/work/timing.json" ]] || {
  echo "缺少 voice.wav 或 timing.json；移除 SKIP_VO 后重跑" >&2
  exit 3
}

PROPS="$($PYTHON "$ROOT/scripts/cloud/prepare_job.py" "$JOB" --repo "$ROOT")"
SLUG="$($PYTHON -c 'import json,sys; print(json.load(open(sys.argv[1]))["slug"])' "$JOB/project.json")"
OUT="${OUT:-$ROOT/output/$SLUG.mp4}"
CONCURRENCY="${CONCURRENCY:-2}"

CHROME_ARGS=()
if [[ -n "${CHROME:-}" && -x "$CHROME" ]]; then
  CHROME_ARGS=(--browser-executable="$CHROME")
elif [[ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]]; then
  CHROME_ARGS=(--browser-executable="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
elif command -v google-chrome >/dev/null 2>&1; then
  CHROME_ARGS=(--browser-executable="$(command -v google-chrome)")
elif command -v chromium >/dev/null 2>&1; then
  CHROME_ARGS=(--browser-executable="$(command -v chromium)")
fi

cd "$ROOT/remotion"
npx remotion render src/index.ts CloudVideo "$OUT" \
  --props="$PROPS" \
  --concurrency="$CONCURRENCY" \
  --crf "${CRF:-18}" \
  "${CHROME_ARGS[@]}"

"$PYTHON" "$ROOT/scripts/cloud/qa_video.py" "$OUT"
echo "成片: $OUT"
