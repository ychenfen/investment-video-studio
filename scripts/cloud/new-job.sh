#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SLUG="${1:-}"

if [[ ! "$SLUG" =~ ^[a-z0-9][a-z0-9-]{1,62}$ ]]; then
  echo "用法: $0 <slug>; slug 只能是 2-63 位小写字母、数字和连字符" >&2
  exit 2
fi

DEST="$ROOT/content/jobs/$SLUG"
if [[ -e "$DEST" ]]; then
  echo "任务已存在，拒绝覆盖: $DEST" >&2
  exit 3
fi

mkdir -p "$DEST/assets"
cp "$ROOT/content/jobs/_template/brief.md" "$DEST/brief.md"
cp "$ROOT/content/jobs/_template/project.json" "$DEST/project.json"
cp "$ROOT/content/jobs/_template/sources.json" "$DEST/sources.json"
cp "$ROOT/content/jobs/_template/assets.json" "$DEST/assets.json"

python3 - "$DEST/project.json" "$SLUG" <<'PY'
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
slug = sys.argv[2]
project = json.loads(path.read_text(encoding="utf-8"))
project["slug"] = slug
path.write_text(
    json.dumps(project, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
PY

echo "created $DEST"
echo "next: fill brief.md, sources.json, assets.json, project.json"
