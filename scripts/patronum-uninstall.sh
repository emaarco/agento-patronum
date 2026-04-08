#!/usr/bin/env bash
# agento-patronum — Clean up user config after plugin uninstall
# Usage: bash scripts/patronum-uninstall.sh

set -euo pipefail

PATRONUM_DIR="$HOME/.claude/patronum"
REMOVED=0

if [ -d "$PATRONUM_DIR" ]; then
  CONFIG_FILE="$PATRONUM_DIR/patronum.json"
  COUNT="unknown"
  if [ -f "$CONFIG_FILE" ]; then
    COUNT=$(jq '.entries | length' "$CONFIG_FILE" 2>/dev/null || echo "unknown")
  fi
  rm -rf "$PATRONUM_DIR"
  echo "agento-patronum: removed $PATRONUM_DIR ($COUNT patterns in user config)"
  REMOVED=$((REMOVED + 1))
else
  echo "agento-patronum: no config directory found at $PATRONUM_DIR"
fi

if [ "$REMOVED" -gt 0 ]; then
  echo "agento-patronum: cleanup complete. Plugin fully uninstalled."
else
  echo "agento-patronum: nothing to clean up."
fi
