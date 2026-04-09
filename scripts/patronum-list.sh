#!/usr/bin/env bash
# agento-patronum — List all protected patterns
# Usage: patronum-list.sh

set -euo pipefail

if ! command -v jq &> /dev/null; then
  echo "ERROR: jq is required but not installed. Install with: brew install jq (macOS) or apt install jq (Linux)" >&2
  exit 1
fi

# shellcheck source=patronum-config-resolver.sh
source "$(dirname "$0")/patronum-config-resolver.sh"

print_config() {
  local CFG="$1" LABEL="$2"
  [ ! -f "$CFG" ] && return
  local COUNT
  COUNT=$(jq '.entries | length' "$CFG")
  echo "$LABEL ($COUNT patterns)"
  echo "Config: $CFG"
  if [ "$COUNT" -gt 0 ]; then
    echo ""
    printf "  %-33s %-10s %s\n" "PATTERN" "SOURCE" "REASON"
    printf "  %-33s %-10s %s\n" "-------" "------" "------"
    jq -r '.entries[] | [.pattern, .source, .reason] | @tsv' "$CFG" | while IFS=$'\t' read -r PATTERN SOURCE REASON; do
      printf "  %-33s %-10s %s\n" "$PATTERN" "$SOURCE" "$REASON"
    done
  fi
}

if [ ! -f "$PATRONUM_USER_CONFIG" ] && \
   { [ -z "${PATRONUM_PROJ_CONFIG:-}" ] || [ ! -f "$PATRONUM_PROJ_CONFIG" ]; } && \
   { [ -z "${PATRONUM_LOCAL_REPO_CONFIG:-}" ] || [ ! -f "$PATRONUM_LOCAL_REPO_CONFIG" ]; }; then
  echo "Error: no config found. Run /patronum-verify to check setup." >&2
  exit 1
fi

print_config "$PATRONUM_USER_CONFIG" "User config (always active)"

if [ -n "${PATRONUM_PROJ_CONFIG:-}" ] && [ -f "$PATRONUM_PROJ_CONFIG" ]; then
  echo ""
  print_config "$PATRONUM_PROJ_CONFIG" "Project config (committed, merged on top)"
fi

if [ -n "${PATRONUM_LOCAL_REPO_CONFIG:-}" ] && [ -f "$PATRONUM_LOCAL_REPO_CONFIG" ]; then
  echo ""
  print_config "$PATRONUM_LOCAL_REPO_CONFIG" "Local repo config (gitignored, merged on top)"
fi
