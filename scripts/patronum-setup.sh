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

CONFIG_DIR="$HOME/.claude"
CONFIG_FILE="$CONFIG_DIR/patronum.json"
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
if [ -z "${CLAUDE_PLUGIN_ROOT:-}" ]; then
  echo "agento-patronum: warning: CLAUDE_PLUGIN_ROOT not set, using fallback path: $PLUGIN_ROOT" >&2
fi
DEFAULTS="$PLUGIN_ROOT/defaults/patronum.json"

mkdir -p "$CONFIG_DIR"

if [ ! -f "$CONFIG_FILE" ]; then
  cp "$DEFAULTS" "$CONFIG_FILE"
  echo "agento-patronum: first-time setup complete. Default protections installed."
fi

COUNT=$(jq '.entries | length' "$CONFIG_FILE")
echo "agento-patronum: protection active. $COUNT patterns loaded."
