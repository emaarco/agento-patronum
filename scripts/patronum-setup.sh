#!/usr/bin/env bash
# agento-patronum — SessionStart hook
# Copies default config on first run. Safe to run every session.

set -euo pipefail

CONFIG_DIR="$HOME/.claude"
CONFIG_FILE="$CONFIG_DIR/patronum.json"
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
DEFAULTS="$PLUGIN_ROOT/defaults/patronum.json"

mkdir -p "$CONFIG_DIR"

if [ ! -f "$CONFIG_FILE" ]; then
  cp "$DEFAULTS" "$CONFIG_FILE"
  echo "agento-patronum: first-time setup complete. Default protections installed."
fi

COUNT=$(jq '.entries | length' "$CONFIG_FILE")
echo "agento-patronum: protection active. $COUNT patterns loaded."
