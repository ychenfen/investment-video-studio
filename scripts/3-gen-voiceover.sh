#!/bin/bash
# edge-tts 生成配音 + 拿每句时长(字幕对齐关键) + 拼接成段
# 用法: 改下面 TEXTS 文案, 跑: ./3-gen-voiceover.sh [输出mp3] [输出目录]
# 依赖: edge-tts(python3.13装), 代理7897(连微软)
# 音色: 云扬YunyangNeural(新闻男,推荐) 云健YunjianNeural(沉稳) 晓晓XiaoxiaoNeural(女) 云希YunxiNeural(年轻)
# 关键: 拿到每句时长后, *30 累加(句间+9帧=0.3s) 算字幕 from/to, 填进组件 SUBS 数组
EDGE=~/Library/Python/3.13/bin/edge-tts
VOICE="${VOICE:-zh-CN-YunyangNeural}"
RATE="${RATE:-+6%}"
OUT="${1:-../remotion/public/voiceover.mp3}"
TMP="${2:-/tmp/vo_seg}"
mkdir -p "$TMP"
export http_proxy=http://127.0.0.1:7897 https_proxy=http://127.0.0.1:7897

# === 改这里的旁白(每句一行) ===
TEXTS=(
  "今天聊聊黄仁勋台北GTC演讲，最重要的一件事。"
  "他给AI Agent，下了一个清晰的定义。"
  "Agent，等于大模型，加上工具框架Harness。"
  "核心是一个四步循环：观察、推理、行动、记忆。"
  "这套控制循环，就是未来十年AI竞争的主战场。"
)

inputs=""; filters=""; i=0
for t in "${TEXTS[@]}"; do
  "$EDGE" --proxy http://127.0.0.1:7897 --voice "$VOICE" --rate "$RATE" --text "$t" --write-media "$TMP/s$i.mp3"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP/s$i.mp3")
  echo "句$i: ${dur}s  ->  $t"
  inputs="$inputs -i $TMP/s$i.mp3"
  i=$((i+1))
done

# 拼接(句间0.3s停顿): 前 n-1 句 apad 0.3s, concat
n=$i; fc=""; concat=""
for ((j=0;j<n;j++)); do
  if [ $j -lt $((n-1)) ]; then fc="$fc[$j]apad=pad_dur=0.3[a$j];"; concat="$concat[a$j]"; else concat="$concat[$j]"; fi
done
ffmpeg -y $inputs -filter_complex "${fc}${concat}concat=n=$n:v=0:a=1[o]" -map "[o]" "$OUT"
echo "配音: $OUT ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")s)"
