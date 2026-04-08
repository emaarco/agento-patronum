#!/usr/bin/env bash
# agento-patronum — Add a pattern to the protection list
# Usage: patronum-add.sh "<pattern>" [--reason "reason"]

set -euo pipefail

if ! command -v jq &> /dev/null; then
  echo "ERROR: jq is required but not installed. Install with: brew install jq (macOS) or apt install jq (Linux)" >&2
  exit 1
fi

# Resolve config path (project-level takes priority over user-level)
# shellcheck source=patronum-config-resolver.sh
source "$(dirname "$0")/patronum-config-resolver.sh"

if [ $# -lt 1 ]; then
  echo "Usage: patronum-add.sh \"<pattern>\" [--reason \"reason\"]" >&2
  exit 1
fi

PATTERN="$1"
shift

if [ -z "$PATTERN" ]; then
  echo "Error: pattern cannot be empty" >&2
  exit 1
fi

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

if [ ! -f "$PATRONUM_CONFIG" ]; then
  echo "Error: $PATRONUM_CONFIG not found. Run /patronum-verify to check setup." >&2
  exit 1
fi

# Check if pattern already exists
EXISTING=$(jq -r --arg pat "$PATTERN" '.entries[] | select(.pattern == $pat) | .pattern' "$PATRONUM_CONFIG")
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
   "$PATRONUM_CONFIG" > "$TMPFILE" && mv "$TMPFILE" "$PATRONUM_CONFIG"

echo "Added pattern: $PATTERN"
[ -n "$REASON" ] && echo "Reason: $REASON"

COUNT=$(jq '.entries | length' "$PATRONUM_CONFIG")
echo "Total patterns: $COUNT"
