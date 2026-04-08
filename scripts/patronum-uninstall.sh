#!/usr/bin/env bash
# agento-patronum — Clean up user config after plugin uninstall
# Usage: bash scripts/patronum-uninstall.sh

set -euo pipefail

CONFIG_FILE="$HOME/.claude/patronum.json"
LOG_FILE="$HOME/.claude/patronum.log"

REMOVED=0

if [ -f "$CONFIG_FILE" ]; then
  COUNT=$(jq '.entries | length' "$CONFIG_FILE" 2>/dev/null || echo "unknown")
  rm "$CONFIG_FILE"
  echo "agento-patronum: removed $CONFIG_FILE ($COUNT patterns)"
  REMOVED=$((REMOVED + 1))
else
  echo "agento-patronum: no config found at $CONFIG_FILE"
fi

if [ -f "$LOG_FILE" ]; then
  LINES=$(wc -l < "$LOG_FILE" | tr -d ' ')
  rm "$LOG_FILE"
  echo "agento-patronum: removed $LOG_FILE ($LINES log entries)"
  REMOVED=$((REMOVED + 1))
else
  echo "agento-patronum: no log found at $LOG_FILE"
fi

if [ "$REMOVED" -gt 0 ]; then
  echo "agento-patronum: cleanup complete. Plugin fully uninstalled."
else
  echo "agento-patronum: nothing to clean up."
fi
