#!/usr/bin/env bash
# agento-patronum — Add a pattern to the protection list
# Usage: patronum-add.sh "<pattern>" [--reason "reason"]

set -euo pipefail

CONFIG_FILE="$HOME/.claude/patronum.json"

if [ $# -lt 1 ]; then
  echo "Usage: patronum-add.sh \"<pattern>\" [--reason \"reason\"]" >&2
  exit 1
fi

PATTERN="$1"
shift

REASON=""
while [ $# -gt 0 ]; do
  case "$1" in
    --reason)
      REASON="${2:-}"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: $CONFIG_FILE not found. Run /patronum-verify to check setup." >&2
  exit 1
fi

# Check if pattern already exists
EXISTING=$(jq -r --arg pat "$PATTERN" '.entries[] | select(.pattern == $pat) | .pattern' "$CONFIG_FILE")
if [ -n "$EXISTING" ]; then
  echo "Pattern '$PATTERN' already exists in the protection list."
  exit 0
fi

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Add entry
TMPFILE=$(mktemp)
jq --arg pat "$PATTERN" \
   --arg reason "$REASON" \
   --arg ts "$TIMESTAMP" \
   '.entries += [{"pattern": $pat, "type": "glob", "reason": $reason, "addedAt": $ts, "source": "user"}]' \
   "$CONFIG_FILE" > "$TMPFILE" && mv "$TMPFILE" "$CONFIG_FILE"

echo "Added pattern: $PATTERN"
[ -n "$REASON" ] && echo "Reason: $REASON"

COUNT=$(jq '.entries | length' "$CONFIG_FILE")
echo "Total patterns: $COUNT"
