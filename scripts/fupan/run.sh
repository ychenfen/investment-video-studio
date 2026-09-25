#!/bin/bash
# 复盘故事视频 · 一键重生成
#   改 script.json(文案/角色/关键词) → 跑本脚本 → 配音、时间轴、画面、字体、混音、成片全部自动重排
#
# 用法:
#   ./scripts/fupan/run.sh                 # edge-tts 配音(默认, 需能连微软, 见 EDGE_PROXY)
#   TTS_ENGINE=kokoro ./scripts/fupan/run.sh   # 本地离线 Kokoro 配音
#   SKIP_VO=1 ./scripts/fupan/run.sh       # 只改了画面(build.mjs/chars.mjs), 复用现有配音和时间轴
#   SKIP_RENDER=1 ./scripts/fupan/run.sh   # 只生成素材, 去 Remotion Studio 预览
#
# 依赖: python3 (numpy soundfile fonttools brotli edge-tts | kokoro-onnx misaki[zh]), node, ffmpeg
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
GEN="$REPO/remotion/src/fupan/generated"
PUB="$REPO/remotion/public/fupan"
WORK="$HERE/work"
PY="${PYTHON:-python3}"
mkdir -p "$WORK" "$GEN" "$PUB"
export EDGE_PROXY="${EDGE_PROXY:-http://127.0.0.1:7897}"

if [ "${SKIP_VO:-0}" != "1" ]; then
  echo "== 1/5 配音 + 句级时间轴 (${TTS_ENGINE:-edge})"
  "$PY" "$HERE/make_vo.py" "$HERE/script.json" "$WORK" --engine "${TTS_ENGINE:-edge}"
  cp "$WORK/timing.json" "$GEN/timing.json"
fi
[ -f "$WORK/vo.wav" ] || { echo "缺 $WORK/vo.wav, 先不带 SKIP_VO 跑一次"; exit 1; }

echo "== 2/5 生成画面 (markup/styles/timeline)"
node "$HERE/build.mjs"

echo "== 3/5 字体子集"
"$PY" "$HERE/subset.py"

echo "== 4/5 混音 + 响度 -15 LUFS"
"$PY" "$HERE/mix.py" "$GEN/timing.json" "$WORK/vo.wav" "$WORK/mix_raw.wav"
ffmpeg -v error -y -i "$WORK/mix_raw.wav" -af loudnorm=I=-15:TP=-1.5:LRA=11 -ar 44100 -b:a 192k "$PUB/mix.mp3"

if [ "${SKIP_RENDER:-0}" != "1" ]; then
  echo "== 5/5 Remotion 渲染"
  cd "$REPO/remotion"
  CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
  OUT="${OUT:-$REPO/output/复盘看赚钱效应.mp4}"
  npx remotion render src/index.ts FupanStory "$OUT" \
    --browser-executable="$CHROME" --concurrency="${CONCURRENCY:-1}" --crf 18
  echo "成片: $OUT"
fi
