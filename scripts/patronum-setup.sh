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

mkdir -p "$PATRONUM_DIR/projects"

# Migrate from old flat location if needed
OLD_CONFIG="$HOME/.claude/patronum.json"
OLD_LOG="$HOME/.claude/patronum.log"
if [ -f "$OLD_CONFIG" ] && [ ! -f "$CONFIG_FILE" ]; then
  mv "$OLD_CONFIG" "$CONFIG_FILE"
  echo "agento-patronum: migrated config from $OLD_CONFIG to $CONFIG_FILE"
fi
if [ -f "$OLD_LOG" ] && [ ! -f "$PATRONUM_DIR/user.log" ]; then
  mv "$OLD_LOG" "$PATRONUM_DIR/user.log"
fi

if [ ! -f "$CONFIG_FILE" ]; then
  cp "$DEFAULTS" "$CONFIG_FILE"
  echo "agento-patronum: first-time setup complete. Default protections installed."
fi

COUNT=$(jq '.entries | length' "$CONFIG_FILE")
echo "agento-patronum: protection active. $COUNT patterns loaded."
