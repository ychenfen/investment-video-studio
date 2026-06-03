#!/bin/bash
# 渲染三段 + ffmpeg 拼接完整片
# 用法: ./5-render-and-concat.sh
# 依赖: remotion(node_modules已含), 系统Chrome, ffmpeg
# 坑: 必带 --browser-executable(系统Chrome) + --concurrency=1(防多tab崩)
#     WebGL段慢, 全片1800帧可能20-40分钟
set -e
cd "$(dirname "$0")/../remotion"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OPTS=(--browser-executable="$CHROME" --concurrency=1 --crf 16 --timeout=120000)

echo "=== 渲染黄仁勋段 (720帧) ==="
npx remotion render src/index.ts NewsStyle out/news.mp4 "${OPTS[@]}"
echo "=== 渲染 NVDA 段 (480帧) ==="
npx remotion render src/index.ts StockAnalysis out/nvda.mp4 "${OPTS[@]}"
echo "=== 渲染寒武纪段 (600帧) ==="
npx remotion render src/index.ts StockCambricon out/cam.mp4 "${OPTS[@]}"

echo "=== 拼接 (concat filter 重编码) ==="
ffmpeg -y -i out/news.mp4 -i out/nvda.mp4 -i out/cam.mp4 \
  -filter_complex "[0:v][0:a][1:v][1:a][2:v][2:a]concat=n=3:v=1:a=1[v][a]" \
  -map "[v]" -map "[a]" -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 18 \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart out/full-video.mp4

echo "完整片: remotion/out/full-video.mp4 ($(ffprobe -v error -show_entries format=duration -of csv=p=0 out/full-video.mp4)s)"
