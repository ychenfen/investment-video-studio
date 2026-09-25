#!/usr/bin/env bash
# Repository-scoped Claude SessionStart hook. Never blocks a session: failures
# remain visible and doctor.sh will fail before rendering.
set -u

if [[ "${CLAUDE_CODE_REMOTE:-false}" != "true" ]]; then
  exit 0
fi

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
VENV="$ROOT/.venv-cloud"

echo "[cloud-setup] preparing investment-video-studio"

if [[ ! -x "$ROOT/remotion/node_modules/.bin/remotion" || "$ROOT/remotion/package-lock.json" -nt "$ROOT/remotion/node_modules/.package-lock.json" ]]; then
  (
    cd "$ROOT/remotion" &&
      npm ci --registry=https://registry.npmjs.org --replace-registry-host=always
  ) || echo "[cloud-setup] WARN: npm ci failed; run scripts/cloud/doctor.sh for details" >&2
fi

if [[ ! -x "$VENV/bin/python" ]]; then
  python3 -m venv "$VENV" || echo "[cloud-setup] WARN: could not create $VENV" >&2
fi

if [[ -x "$VENV/bin/python" ]]; then
  "$VENV/bin/python" -m pip install --disable-pip-version-check -q -r "$ROOT/scripts/cloud/requirements.txt" || \
    echo "[cloud-setup] WARN: Python dependency install failed" >&2
fi

if [[ -x "$ROOT/remotion/node_modules/.bin/remotion" ]]; then
  (
    cd "$ROOT/remotion" &&
      ./node_modules/.bin/remotion browser ensure
  ) || echo "[cloud-setup] WARN: Chrome download failed; rendering will retry" >&2
fi

"$ROOT/scripts/cloud/doctor.sh" --brief || true
exit 0
