#!/usr/bin/env bash
# Paste this file into Claude Code Cloud > Environment > Setup script.
# It runs as root on Ubuntu 24.04 before Claude Code starts and is cached.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends \
  ffmpeg \
  fontconfig \
  fonts-noto-cjk \
  fonts-noto-cjk-extra \
  libsndfile1 \
  libasound2t64 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libnss3 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxkbcommon0 \
  libxrandr2 \
  python3 \
  python3-venv

fc-cache -f
ffmpeg -version | head -1
fc-match 'Noto Sans CJK SC' | head -1
