#!/bin/bash
# 成片验收: 流参数 / 时长 / 响度 + 抽 4 帧 (开头封面 / 1/3 / 2/3 / 结尾) 供目视检查
# 用法: check.sh <mp4> <timing.json> <抽帧输出目录>
set -euo pipefail
MP4="$1"; TIMING="$2"; DIR="$3"
mkdir -p "$DIR"
fail=0
v=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt -of csv=p=0 "$MP4")
a=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels -of csv=p=0 "$MP4")
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$MP4")
want=$(python3 -c "import json;print(json.load(open('$TIMING'))['duration'])")
eng=$(python3 -c "import json;print(json.load(open('$TIMING'))['engine'])")
echo "视频: $v"; echo "音频: $a"; echo "时长: ${d}s (配音时间轴 ${want}s)"
[[ "$v" == h264,1080,1920,yuv420p,30/1 ]] || { echo "FAIL 视频流不是 h264 1080x1920 30fps yuv420p"; fail=1; }
[[ "$a" == aac,48000,2 ]] || { echo "FAIL 音频流不是 aac 48k 立体声"; fail=1; }
python3 -c "import sys;sys.exit(0 if abs($d-$want)<0.5 else 1)" || { echo "FAIL 时长和时间轴差超过 0.5s"; fail=1; }
lufs=$(ffmpeg -hide_banner -nostats -i "$MP4" -af ebur128 -f null - 2>&1 | awk '/I:/{v=$2} END{print v}')
echo "响度: ${lufs} LUFS (目标 -14)"
[ "$eng" = "edge" ] || [ "$eng" = "kokoro" ] || echo "注意: 配音引擎是 $eng, 只能当排版预览, 不能发布"
for k in 0 0.33 0.66 0.97; do
  t=$(python3 -c "print(max(0.0, $d*$k))")
  ffmpeg -v error -y -ss "$t" -i "$MP4" -frames:v 1 -vf scale=540:-2 "$DIR/check-$k.png"
done
echo "抽帧: $DIR/check-*.png"
[ $fail = 0 ] && echo "验收通过" || { echo "验收未通过"; exit 1; }
