#!/usr/bin/env bash
# agento-patronum — List all protected patterns
# Usage: patronum-list.sh

set -euo pipefail

CONFIG_FILE="$HOME/.claude/patronum.json"

if ! command -v jq &> /dev/null; then
  echo "ERROR: jq is required but not installed. Install with: brew install jq (macOS) or apt install jq (Linux)" >&2
  exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: $CONFIG_FILE not found. Run /patronum-verify to check setup." >&2
  exit 1
fi

COUNT=$(jq '.entries | length' "$CONFIG_FILE")

if [ "$COUNT" -eq 0 ]; then
  echo "No protection patterns configured."
  exit 0
fi

echo "agento-patronum: $COUNT protected patterns"
echo ""
printf "%-35s %-10s %s\n" "PATTERN" "SOURCE" "REASON"
printf "%-35s %-10s %s\n" "-------" "------" "------"

jq -r '.entries[] | [.pattern, .source, .reason] | @tsv' "$CONFIG_FILE" | while IFS=$'\t' read -r PATTERN SOURCE REASON; do
  printf "%-35s %-10s %s\n" "$PATTERN" "$SOURCE" "$REASON"
done
