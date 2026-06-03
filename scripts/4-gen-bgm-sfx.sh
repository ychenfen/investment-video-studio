#!/bin/bash
# 下无版权 BGM(YouTube NCS) + 合成卡点音效
# 用法: ./4-gen-bgm-sfx.sh
# 依赖: yt-dlp + chrome cookies + 代理7897, ffmpeg
# 注意: NCS 免版权但发布前确认具体曲目 license(是否要署名)
export http_proxy=http://127.0.0.1:7897 https_proxy=http://127.0.0.1:7897
PUB="../remotion/public"

echo "=== 下 BGM (NCS 无版权科技音乐, 30-70s 段) ==="
/opt/homebrew/bin/yt-dlp --cookies-from-browser chrome --no-warnings \
  --extractor-args "youtube:player_client=web,mweb,tv" \
  -x --audio-format mp3 --audio-quality 4 --download-sections "*30-70" \
  -o "/tmp/bgm_raw.%(ext)s" \
  "ytsearch1:NCS no copyright technology corporate background music"
# 循环填到24s + 淡入淡出 + 立体声
ffmpeg -y -stream_loop 3 -i /tmp/bgm_raw.mp3 -t 24 \
  -af "afade=t=in:d=1.5,afade=t=out:st=22:d=2,aformat=channel_layouts=stereo" "$PUB/bgm.wav"

echo "=== 合成卡点音效 (1320Hz 正弦衰减) ==="
ffmpeg -y -f lavfi -i "sine=frequency=1320:duration=0.3" \
  -af "volume=0.5,afade=t=out:st=0.04:d=0.26" "$PUB/ding.wav"

echo "完成: $PUB/bgm.wav + ding.wav"
# 备选: 纯合成 BGM(无网络/无版权风险, 但单调):
# ffmpeg -y -f lavfi -i "sine=frequency=110:duration=24" -f lavfi -i "sine=frequency=164.8:duration=24" -f lavfi -i "sine=frequency=220:duration=24" \
#   -filter_complex "[0][1][2]amix=inputs=3,tremolo=f=0.3:d=0.4,volume=0.12,aformat=channel_layouts=stereo" "$PUB/bgm.wav"
