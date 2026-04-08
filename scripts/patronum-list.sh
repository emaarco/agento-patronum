#!/usr/bin/env bash
# agento-patronum — List all protected patterns
# Usage: patronum-list.sh

set -euo pipefail

if ! command -v jq &> /dev/null; then
  echo "ERROR: jq is required but not installed. Install with: brew install jq (macOS) or apt install jq (Linux)" >&2
  exit 1
fi

# Resolve config path (project-level takes priority over user-level)
# shellcheck source=patronum-config-resolver.sh
source "$(dirname "$0")/patronum-config-resolver.sh"

if [ ! -f "$PATRONUM_CONFIG" ]; then
  echo "Error: $PATRONUM_CONFIG not found. Run /patronum-verify to check setup." >&2
  exit 1
fi

COUNT=$(jq '.entries | length' "$PATRONUM_CONFIG")

if [ "$COUNT" -eq 0 ]; then
  echo "No protection patterns configured."
  exit 0
fi

echo "agento-patronum: $COUNT protected patterns"
echo "Config: $PATRONUM_CONFIG"
echo ""
printf "%-35s %-10s %s\n" "PATTERN" "SOURCE" "REASON"
printf "%-35s %-10s %s\n" "-------" "------" "------"

jq -r '.entries[] | [.pattern, .source, .reason] | @tsv' "$PATRONUM_CONFIG" | while IFS=$'\t' read -r PATTERN SOURCE REASON; do
  printf "%-35s %-10s %s\n" "$PATTERN" "$SOURCE" "$REASON"
done
