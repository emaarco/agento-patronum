#!/usr/bin/env bash
# agento-patronum — SessionStart hook
# Copies default config on first run. Safe to run every session.

set -euo pipefail

# Check for jq dependency
if ! command -v jq &> /dev/null; then
  echo "ERROR: jq is required but not installed." >&2
  echo "Install with:" >&2
  echo "  macOS:  brew install jq" >&2
  echo "  Linux:  apt install jq (Debian/Ubuntu) or yum install jq (RHEL/CentOS)" >&2
  echo "  WSL:    apt install jq" >&2
  exit 1
fi

PATRONUM_DIR="$HOME/.claude/patronum"
CONFIG_FILE="$PATRONUM_DIR/user.json"
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
if [ -z "${CLAUDE_PLUGIN_ROOT:-}" ]; then
  echo "agento-patronum: warning: CLAUDE_PLUGIN_ROOT not set, using fallback path: $PLUGIN_ROOT" >&2
fi
DEFAULTS="$PLUGIN_ROOT/defaults/patronum.json"

# Ensure user config directory exists
mkdir -p "$PATRONUM_DIR"

# Initialise user config if missing
if [ ! -f "$CONFIG_FILE" ]; then
  cp "$DEFAULTS" "$CONFIG_FILE"
  echo "agento-patronum: first-time setup complete. Default protections installed."
fi

# Detect project-scope install: .claude/settings.json in the git root lists agento-patronum
_GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [ -n "$_GIT_ROOT" ] && [ -f "$_GIT_ROOT/.claude/settings.json" ]; then
  if jq -e '(.enabledPlugins // {}) | to_entries[] | select(.key | startswith("agento-patronum")) | .value' \
      "$_GIT_ROOT/.claude/settings.json" 2>/dev/null | grep -q true; then
    PROJ_PATRONUM_DIR="$_GIT_ROOT/.claude/patronum"
    PROJ_CONFIG="$PROJ_PATRONUM_DIR/patronum.json"
    mkdir -p "$PROJ_PATRONUM_DIR"
    if [ ! -f "$PROJ_CONFIG" ]; then
      cp "$DEFAULTS" "$PROJ_CONFIG"
      echo "agento-patronum: project-scope install detected."
      echo "agento-patronum: created $PROJ_CONFIG with default protections."
      echo "agento-patronum: commit this file to share protection rules with your team."
      echo "agento-patronum: add .claude/patronum/patronum.log to your .gitignore."
    fi
  fi
fi
unset _GIT_ROOT

COUNT=$(jq '.entries | length' "$CONFIG_FILE")
echo "agento-patronum: protection active. $COUNT patterns loaded."
