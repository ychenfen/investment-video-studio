#!/bin/bash
# Hypit 低成本试验: 复用已验收的配音/画面/字体, 不调用任何图片/视频生成模型, 只渲染前 25 秒(750 帧), 并发 2
#
# 前置(一次):
#   git clone https://github.com/hypit-ai/hypit.git ~/code/hypit && cd ~/code/hypit
#   corepack enable && pnpm install --frozen-lockfile && pnpm build:public-types
#   (Node >= 22.15, pnpm 10.33; Hypit 仓库需放在 pnpm workspace 能识别的 examples/*/packages/* 下)
#
# 用法: HYPIT_HOME=~/code/hypit ./hypit-trial/run.sh [script.json]
#   默认用 scripts/fupan/script.json; 传入改过的 script.json 即可做"改文案自动重排"测试
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/.." && pwd)"
HYPIT="${HYPIT_HOME:?设置 HYPIT_HOME=Hypit 仓库路径}"
SCRIPT="${1:-$REPO/scripts/fupan/script.json}"
PROJ="$HYPIT/examples/fupan-trial"; PY="${PYTHON:-python3}"
mkdir -p "$PROJ"; cp -R "$HERE/." "$PROJ/"; cd "$PROJ"; mkdir -p assets work

echo "== 1/5 配音 + 句级时间轴(与 Remotion 管线同一个 make_vo.py)"
"$PY" "$REPO/scripts/fupan/make_vo.py" "$SCRIPT" work --engine "${TTS_ENGINE:-edge}"
cp "$SCRIPT" assets/script.json; cp work/timing.json assets/timing.json

echo "== 2/5 分轨: 人声 + 配乐音效(同一混音, 分开交给 Hypit)"
"$PY" stems.py assets/timing.json work/vo.wav assets/voice.wav assets/music-sfx.wav

echo "== 3/5 画面资产打包进 Hypit 组件 + 生成 Script/Source"
# 画面生成器写到试验自己的 work/ 目录, 不改动仓库里 Remotion 版的已生成文件
export FUPAN_GEN="$PROJ/work/gen" FUPAN_WORK="$PROJ/work" FUPAN_FONTS="$PROJ/work/fonts"
mkdir -p "$FUPAN_GEN" "$FUPAN_FONTS"; cp assets/timing.json "$FUPAN_GEN/timing.json"
node "$REPO/scripts/fupan/build.mjs" >/dev/null; "$PY" "$REPO/scripts/fupan/subset.py" >/dev/null
cp "$REPO/remotion/public/fupan/fonts/"num-*.woff2 "$FUPAN_FONTS/"
node gen-assets.mjs "$REPO"; node gen-script.mjs assets/script.json
( cd "$HYPIT" && pnpm install >/dev/null && pnpm --filter @example/fupan-scene build >/dev/null )

echo "== 4/5 启动 WhisperX 替身(把已知的逐字时间按 WhisperX 格式交给 Hypit)"
FUPAN_TIMING=assets/timing.json FUPAN_SCRIPT=assets/script.json node stub/whisperx-stub.mjs & STUB=$!
trap 'kill $STUB 2>/dev/null || true' EXIT; sleep 1

echo "== 5/5 Hypit 构建(9 个本地请求, 无付费调用)"
cd "$HYPIT"
node bin/hypit.mjs check examples/fupan-trial/runs/trial.svrun --workspace examples/fupan-trial
node bin/hypit.mjs build examples/fupan-trial/runs/trial.svrun --workspace examples/fupan-trial \
  --runtime "${HYPIT_RUNTIME:-examples/fupan-trial/hypit.runtime.json}" --follow
B=$(ls -t examples/fupan-trial/.hypit/results/*/ | head -1)
node bin/hypit.mjs get "$B" --output trial.video --workspace examples/fupan-trial --to "$REPO/output/hypit试验-$(date +%m%d-%H%M).mp4"
