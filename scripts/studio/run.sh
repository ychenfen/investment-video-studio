#!/bin/bash
# 通用讲解视频 · 给文案就出片
#   projects/<slug>/script.json → 体检 → 配音+时间轴 → 实拍素材 → props+字体 → 混音 → 渲染 → 验收
#
# 用法:
#   ./scripts/studio/run.sh <slug>                  全流程, 成片 output/<slug>.mp4
#   TTS_ENGINE=silent ./scripts/studio/run.sh <slug>  不出声, 只看排版(配音服务不通时)
#   SKIP_VO=1     复用上次配音 (只改了画面/素材)
#   SKIP_MEDIA=1  复用上次素材
#   SKIP_RENDER=1 只生成, 去 Remotion Studio 看
#   BGM=0         不要背景音乐;  BGM=path/to.wav 换配乐
#   CONCURRENCY=2 渲染并发 (默认 1)
set -euo pipefail
SLUG="${1:?用法: run.sh <slug>  (项目在 projects/<slug>/script.json)}"
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
PROJ="$REPO/projects/$SLUG"
SCRIPT="$PROJ/script.json"
PUB="$REPO/remotion/public/studio/$SLUG"
BUILD="$PROJ/build"
OUT="${OUT:-$REPO/output/$SLUG.mp4}"
case "$OUT" in /*) ;; *) OUT="$PWD/$OUT" ;; esac  # 渲染时会 cd 到 remotion/, 先转绝对路径
[ -f "$SCRIPT" ] || { echo "找不到 $SCRIPT"; exit 1; }
PY="${PYTHON:-}"
[ -z "$PY" ] && { [ -x "$REPO/.venv/bin/python" ] && PY="$REPO/.venv/bin/python" || PY=python3; }
mkdir -p "$PUB" "$BUILD" "$(dirname "$OUT")"

echo "== 1/7 文案体检"
"$PY" "$HERE/lint.py" "$SCRIPT"

if [ "${SKIP_VO:-0}" != "1" ]; then
  echo "== 2/7 配音 + 时间轴 (${TTS_ENGINE:-auto})"
  "$PY" "$HERE/vo.py" "$SCRIPT" "$BUILD"
  cp "$BUILD/timing.json" "$PUB/timing.json"
fi
[ -f "$BUILD/vo.wav" ] || { echo "缺 $BUILD/vo.wav, 先不带 SKIP_VO 跑一次"; exit 1; }

if [ "${SKIP_MEDIA:-0}" != "1" ]; then
  echo "== 3/7 实拍/实物素材"
  rm -rf "$PUB/media"
  "$PY" "$HERE/media.py" "$SCRIPT" "$PUB"
fi

echo "== 4/7 props + 字体子集"
"$PY" "$HERE/props.py" "$SCRIPT" "$PUB" "$SLUG"

echo "== 5/7 混音 (人声 + 配乐闪避) → -14 LUFS / 48k"
BGM_FILE="${BGM:-$REPO/remotion/public/bgm.wav}"
if [ "$BGM_FILE" != "0" ] && [ -f "$BGM_FILE" ]; then
  ffmpeg -v error -y -i "$BUILD/vo.wav" -stream_loop -1 -i "$BGM_FILE" -filter_complex \
    "[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,asplit=2[vo][key];\
     [1:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.22[bg];\
     [bg][key]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[duck];\
     [vo][duck]amix=inputs=2:duration=first:normalize=0,afade=t=out:st=$("$PY" -c "import json;print(max(0,json.load(open('$PUB/timing.json'))['duration']-1.0))"):d=1,\
     loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a libmp3lame -b:a 192k "$PUB/mix.mp3"
else
  ffmpeg -v error -y -i "$BUILD/vo.wav" -af "aresample=48000,pan=stereo|c0=c0|c1=c0,loudnorm=I=-14:TP=-1.5:LRA=11" \
    -ar 48000 -c:a libmp3lame -b:a 192k "$PUB/mix.mp3"
fi

if [ "${SKIP_RENDER:-0}" = "1" ]; then
  echo "已生成 $PUB/props.json, 预览: cd remotion && npx remotion studio  (选 Explainer, props 用这个文件)"
  exit 0
fi

echo "== 6/7 Remotion 渲染"
CHROME="${CHROME:-}"
if [ -z "$CHROME" ]; then
  for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
           /opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell; do
    [ -x "$c" ] && { CHROME="$c"; break; }
  done
fi
BROWSER_ARG=()
[ -n "$CHROME" ] && BROWSER_ARG=(--browser-executable="$CHROME")
cd "$REPO/remotion"
npx remotion render src/index.ts Explainer "$OUT" --props="$PUB/props.json" \
  "${BROWSER_ARG[@]}" --concurrency="${CONCURRENCY:-1}" --crf 18 \
  --audio-codec=aac --audio-bitrate=192k --timeout=120000

echo "== 7/7 验收"
"$HERE/check.sh" "$OUT" "$PUB/timing.json" "$BUILD"
