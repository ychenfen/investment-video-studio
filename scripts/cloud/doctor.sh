#!/bin/bash
# 云端/本机环境体检: 工具是否齐全 + 各外部服务网络是否放行
# 云端被拦的域名要在 环境设置 → Network access 里加白名单 (见 docs/08-云端工作流.md)
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
ok() { printf '  \033[32m✓\033[0m %s\n' "$*"; }
no() { printf '  \033[31m✗\033[0m %s\n' "$*"; }

echo "工具"
for t in ffmpeg ffprobe node npx espeak-ng; do command -v $t >/dev/null && ok "$t" || no "$t 未安装 (跑 scripts/cloud/setup.sh)"; done
[ -x "$REPO/.venv/bin/python" ] && ok ".venv python" || no ".venv 缺失"
[ -x "$REPO/remotion/node_modules/.bin/remotion" ] && ok "remotion node_modules" || no "remotion 依赖未装"
[ -f /usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc ] || [ -n "${CJK_TTC_DIR:-}" ] && ok "思源黑体 CJK" || no "缺 NotoSansCJK 字体"
ls /opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell >/dev/null 2>&1 \
  || [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ] && ok "渲染浏览器" || no "找不到 headless_shell / Chrome"

echo "网络 (每项后面是用途; ✗ = 该功能在本环境不可用, 流水线会自动降级)"
probe() {
  local code; code=$(curl -s -o /dev/null -m 8 -w '%{http_code}' "$1")
  if [ "$code" != "000" ]; then ok "$2  ($1)"; else no "$2  ($1) 被拦 → 放行 $(echo "$1" | awk -F/ '{print $3}')"; fi
}
probe https://speech.platform.bing.com/            "edge-tts 配音(必需, 否则只能预览)"
probe https://api.pexels.com/v1/                   "Pexels 视频/照片 (需 PEXELS_API_KEY)"
probe https://videos.pexels.com/                   "Pexels 视频下载"
probe https://images.pexels.com/                   "Pexels 照片下载"
probe https://pixabay.com/api/                     "Pixabay 素材 (需 PIXABAY_API_KEY)"
probe https://cdn.pixabay.com/                     "Pixabay 下载"
probe https://commons.wikimedia.org/w/api.php      "Wikimedia 真实公司/人物照片"
probe https://upload.wikimedia.org/                "Wikimedia 下载"
probe https://push2his.eastmoney.com/              "akshare 行情 (K线数据)"
echo "密钥"
[ -n "${PEXELS_API_KEY:-}" ] && ok "PEXELS_API_KEY" || no "PEXELS_API_KEY 未设置 (可选)"
[ -n "${PIXABAY_API_KEY:-}" ] && ok "PIXABAY_API_KEY" || no "PIXABAY_API_KEY 未设置 (可选)"
echo "热点/基本面检索走 Claude 自带的 WebSearch, 不受上面网络限制。"
