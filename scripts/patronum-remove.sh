#!/usr/bin/env bash
# agento-patronum — Remove a pattern from the protection list
# Usage: patronum-remove.sh "<pattern>"

set -euo pipefail

CONFIG_FILE="$HOME/.claude/patronum.json"

if [ $# -lt 1 ]; then
  echo "Usage: patronum-remove.sh \"<pattern>\"" >&2
  exit 1
fi

PATTERN="$1"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: $CONFIG_FILE not found. Run /patronum-verify to check setup." >&2
  exit 1
fi

# Check if pattern exists
EXISTING=$(jq -r --arg pat "$PATTERN" '.entries[] | select(.pattern == $pat) | .pattern' "$CONFIG_FILE")
if [ -z "$EXISTING" ]; then
  echo "Pattern '$PATTERN' not found in the protection list."
  exit 1
fi

# Remove entry
TMPFILE=$(mktemp)
jq --arg pat "$PATTERN" '.entries |= map(select(.pattern != $pat))' "$CONFIG_FILE" > "$TMPFILE" && mv "$TMPFILE" "$CONFIG_FILE"

echo "Removed pattern: $PATTERN"

COUNT=$(jq '.entries | length' "$CONFIG_FILE")
echo "Remaining patterns: $COUNT"
