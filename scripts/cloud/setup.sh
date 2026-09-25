#!/bin/bash
# 云端环境一次性准备 (Claude Code on the web 的 SessionStart hook 自动调用, 本机不跑)
#   ffmpeg / 中文字体 / espeak-ng(预览配音) → apt
#   Python 依赖 → .venv
#   Remotion node_modules → npm (锁文件里是 npmmirror 地址, 云端被拦, 改写到官方源)
# 幂等: 已装的跳过, 重复运行很快。日志: /tmp/studio-setup.log
set -uo pipefail
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
LOG=/tmp/studio-setup.log
say() { echo "[setup] $*" | tee -a "$LOG" >&2; }

if ! command -v ffprobe >/dev/null || [ ! -f /usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc ] || ! command -v espeak-ng >/dev/null; then
  say "apt: ffmpeg fonts-noto-cjk espeak-ng"
  SUDO=""; [ "$(id -u)" != 0 ] && SUDO="sudo"
  $SUDO apt-get update -qq >>"$LOG" 2>&1
  $SUDO apt-get install -y -qq --no-install-recommends ffmpeg fonts-noto-cjk fonts-noto-cjk-extra espeak-ng >>"$LOG" 2>&1 \
    || say "apt 安装失败, 见 $LOG"
fi

if [ ! -x "$REPO/.venv/bin/python" ]; then
  say "python venv"
  python3 -m venv "$REPO/.venv" >>"$LOG" 2>&1
fi
"$REPO/.venv/bin/python" -c "import edge_tts, numpy, soundfile, fontTools, brotli, requests" 2>/dev/null || {
  say "pip: edge-tts numpy soundfile fonttools brotli requests"
  "$REPO/.venv/bin/pip" install -q edge-tts numpy soundfile fonttools brotli requests >>"$LOG" 2>&1 || say "pip 失败, 见 $LOG"
}

if [ ! -x "$REPO/remotion/node_modules/.bin/remotion" ]; then
  say "npm ci (remotion)"
  (cd "$REPO/remotion" && npm ci --no-audit --no-fund \
    --registry=https://registry.npmjs.org/ --replace-registry-host=registry.npmmirror.com >>"$LOG" 2>&1) || say "npm ci 失败, 见 $LOG"
fi

say "完成。体检: ./scripts/cloud/doctor.sh"
