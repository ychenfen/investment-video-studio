#!/bin/bash
# 爬 YouTube 视频片段当中央素材
# 用法: ./1-fetch-jensen-video.sh [youtube_url] [start] [end] [output]
# 例:   ./1-fetch-jensen-video.sh "https://www.youtube.com/watch?v=q_umfWm8J28" 00:12:00 00:12:40
# 依赖: yt-dlp(brew最新版), ffmpeg, 系统Chrome已登录Google, 代理127.0.0.1:7897
# 坑:   ① YouTube要cookies过bot验证 -> --cookies-from-browser chrome
#       ② 反爬随机 -> --extractor-args player_client
#       ③ ffmpeg拉流要走代理 -> 必须小写 http_proxy
set -e
URL="${1:-https://www.youtube.com/watch?v=q_umfWm8J28}"
START="${2:-00:12:00}"
END="${3:-00:12:40}"
OUT="${4:-../remotion/public/center-video.mp4}"

export http_proxy=http://127.0.0.1:7897 https_proxy=http://127.0.0.1:7897
export HTTP_PROXY=http://127.0.0.1:7897 HTTPS_PROXY=http://127.0.0.1:7897

echo "下载 $URL 的 $START-$END 段..."
/opt/homebrew/bin/yt-dlp --cookies-from-browser chrome --no-warnings \
  --extractor-args "youtube:player_client=web,mweb,tv" \
  --download-sections "*${START}-${END}" \
  -f "bv*[height<=1080]+ba/b[height<=1080]" --recode-video mp4 \
  -o "/tmp/yt_raw.mp4" "$URL"

echo "截取 + 去音频 + 1080p + CRF16 -> $OUT"
ffmpeg -y -i /tmp/yt_raw.mp4 -an -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -vf "scale=1920:1080" "$OUT"
echo "完成: $OUT ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")s)"
