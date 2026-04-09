#!/usr/bin/env bash
# agento-patronum — Remove a pattern from the protection list
# Usage: patronum-remove.sh "<pattern>"

set -euo pipefail

if ! command -v jq &> /dev/null; then
  echo "ERROR: jq is required but not installed. Install with: brew install jq (macOS) or apt install jq (Linux)" >&2
  exit 1
fi

# Resolve config path (project-level takes priority over user-level)
# shellcheck source=patronum-config-resolver.sh
source "$(dirname "$0")/patronum-config-resolver.sh"

if [ $# -lt 1 ]; then
  echo "Usage: patronum-remove.sh \"<pattern>\"" >&2
  exit 1
fi

PATTERN="$1"

if [ ! -f "$PATRONUM_CONFIG" ]; then
  echo "Error: $PATRONUM_CONFIG not found. Run /patronum-verify to check setup." >&2
  exit 1
fi

# Check if pattern exists
EXISTING=$(jq -r --arg pat "$PATTERN" '.entries[] | select(.pattern == $pat) | .pattern' "$PATRONUM_CONFIG")
if [ -z "$EXISTING" ]; then
  echo "Pattern '$PATTERN' not found in the protection list."
  exit 1
fi

# Remove entry
TMPFILE=$(mktemp)
jq --arg pat "$PATTERN" '.entries |= map(select(.pattern != $pat))' "$PATRONUM_CONFIG" > "$TMPFILE" && mv "$TMPFILE" "$PATRONUM_CONFIG"

echo "Removed pattern: $PATTERN"

COUNT=$(jq '.entries | length' "$PATRONUM_CONFIG")
echo "Remaining patterns: $COUNT"
