#!/usr/bin/env bash
# agento-patronum — PreToolUse Bash enforcement hook
# Blocks Bash commands matching protected Bash(command) patterns.
# Manage with: /patronum-add /patronum-remove /patronum-list

set -euo pipefail

# Check for jq dependency
if ! command -v jq &> /dev/null; then
  echo "ERROR: jq is required but not installed. agento-patronum cannot function." >&2
  exit 1
fi

# Fail closed if HOME is unset — no config path can be computed
if [ -z "${HOME:-}" ]; then
  echo "PATRONUM: HOME is unset — blocking all tool calls as safe default" >&2
  exit 2
fi

# Resolve config paths (user + optional project, both loaded)
# shellcheck source=patronum-config-resolver.sh
source "$(dirname "$0")/patronum-config-resolver.sh"

# Emit TSV of all patterns from every active config (user + project + local repo, all merged)
patronum_entries() {
  [ -f "$PATRONUM_USER_CONFIG" ] && jq -r '.entries[] | [.pattern, .reason] | @tsv' "$PATRONUM_USER_CONFIG"
  [ -n "${PATRONUM_PROJ_CONFIG:-}" ] && [ -f "$PATRONUM_PROJ_CONFIG" ] && \
    jq -r '.entries[] | [.pattern, .reason] | @tsv' "$PATRONUM_PROJ_CONFIG"
  [ -n "${PATRONUM_LOCAL_REPO_CONFIG:-}" ] && [ -f "$PATRONUM_LOCAL_REPO_CONFIG" ] && \
    jq -r '.entries[] | [.pattern, .reason] | @tsv' "$PATRONUM_LOCAL_REPO_CONFIG"
}

# Collect all config paths that exist for validation
_ACTIVE_CONFIGS=()
[ -f "$PATRONUM_USER_CONFIG" ] && _ACTIVE_CONFIGS+=("$PATRONUM_USER_CONFIG")
[ -n "${PATRONUM_PROJ_CONFIG:-}" ] && [ -f "$PATRONUM_PROJ_CONFIG" ] && _ACTIVE_CONFIGS+=("$PATRONUM_PROJ_CONFIG")
[ -n "${PATRONUM_LOCAL_REPO_CONFIG:-}" ] && [ -f "$PATRONUM_LOCAL_REPO_CONFIG" ] && _ACTIVE_CONFIGS+=("$PATRONUM_LOCAL_REPO_CONFIG")

# If no configs exist at all, allow everything (fail-open)
if [ "${#_ACTIVE_CONFIGS[@]}" -eq 0 ]; then
  exit 0
fi

# Fail closed if any present config is invalid JSON
for _CFG in "${_ACTIVE_CONFIGS[@]}"; do
  if ! jq empty "$_CFG" 2>/dev/null; then
    echo "PATRONUM: config file '$_CFG' is invalid JSON — blocking all tool calls as safe default" >&2
    exit 2
  fi
done
unset _CFG _ACTIVE_CONFIGS

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
[ -z "$COMMAND" ] && exit 0

while IFS=$'\t' read -r PATTERN REASON; do
  [ -z "$PATTERN" ] && continue
  [[ "$PATTERN" != Bash\(*\) ]] && continue  # file patterns do not apply to Bash commands

  BLOCKED_CMD="${PATTERN#Bash(}"
  BLOCKED_CMD="${BLOCKED_CMD%)}"

  if [[ "$COMMAND" == "$BLOCKED_CMD" || "$COMMAND" == "$BLOCKED_CMD "* ]]; then
    TARGET="Bash($COMMAND)"
    jq -n --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg tool "Bash" \
      --arg target "$TARGET" --arg pattern "$PATTERN" \
      '{ts:$ts,tool:$tool,target:$target,pattern:$pattern}' \
      >> "$PATRONUM_LOG" 2>/dev/null || true
    echo "PATRONUM_VIOLATION: Access to '$TARGET' blocked. Pattern: $PATTERN" >&2
    [ -n "$REASON" ] && echo "Reason: $REASON" >&2
    echo "Manage with: /patronum-add or /patronum-remove in Claude Code" >&2
    exit 2
  fi
done < <(patronum_entries)

exit 0
