#!/usr/bin/env bash
# agento-patronum — PreToolUse file enforcement hook
# Blocks Read/Write/Edit/MultiEdit operations on protected file paths.
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

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
if [ -z "$TOOL_NAME" ]; then
  exit 0
fi

# Check a single file path against all protected file patterns.
# Exits 2 immediately if a match is found.
check_file_path() {
  local FILE_PATH="$1"
  local EXPANDED_PATH="${FILE_PATH/#\~/$HOME}"

  while IFS=$'\t' read -r PATTERN REASON; do
    [ -z "$PATTERN" ] && continue
    [[ "$PATTERN" == Bash\(*\) ]] && continue  # Bash patterns do not apply to file paths

    EXPANDED_PATTERN="${PATTERN/#\~/$HOME}"
    # Replace **/ with */ for bash glob matching (single * already matches across / in [[ ]])
    EXPANDED_PATTERN="${EXPANDED_PATTERN//\*\*\//*/}"
    # Handle leading **/ patterns — also match bare filenames at any depth
    BASENAME_PATTERN=""
    [[ "$EXPANDED_PATTERN" == \*\/* ]] && BASENAME_PATTERN="${EXPANDED_PATTERN#\*/}"

    # shellcheck disable=SC2053
    if [[ "$EXPANDED_PATH" == $EXPANDED_PATTERN ]]; then
      jq -n --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg tool "$TOOL_NAME" \
        --arg target "$FILE_PATH" --arg pattern "$PATTERN" \
        '{ts:$ts,tool:$tool,target:$target,pattern:$pattern}' \
        >> "$PATRONUM_LOG" 2>/dev/null || true
      echo "PATRONUM_VIOLATION: Access to '$FILE_PATH' blocked. Pattern: $PATTERN" >&2
      [ -n "$REASON" ] && echo "Reason: $REASON" >&2
      echo "Manage with: /patronum-add or /patronum-remove in Claude Code" >&2
      exit 2
    fi

    # Check basename pattern for ** rules (match files at any depth including root)
    if [ -n "$BASENAME_PATTERN" ]; then
      BN=$(basename "$EXPANDED_PATH")
      # shellcheck disable=SC2053
      if [[ "$BN" == $BASENAME_PATTERN ]]; then
        jq -n --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg tool "$TOOL_NAME" \
          --arg target "$FILE_PATH" --arg pattern "$PATTERN" \
          '{ts:$ts,tool:$tool,target:$target,pattern:$pattern}' \
          >> "$PATRONUM_LOG" 2>/dev/null || true
        echo "PATRONUM_VIOLATION: Access to '$FILE_PATH' blocked. Pattern: $PATTERN" >&2
        [ -n "$REASON" ] && echo "Reason: $REASON" >&2
        echo "Manage with: /patronum-add or /patronum-remove in Claude Code" >&2
        exit 2
      fi
    fi
  done < <(patronum_entries)
}

case "$TOOL_NAME" in
  Read|Write|Edit)
    FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
    [ -z "$FILE_PATH" ] && exit 0
    check_file_path "$FILE_PATH"
    ;;
  MultiEdit)
    while IFS= read -r EDIT_PATH; do
      [ -z "$EDIT_PATH" ] && continue
      check_file_path "$EDIT_PATH"
    done < <(echo "$INPUT" | jq -r '.tool_input.edits[]?.file_path // empty')
    ;;
esac

exit 0
