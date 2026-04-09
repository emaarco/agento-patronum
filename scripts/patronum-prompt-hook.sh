#!/usr/bin/env bash
# agento-patronum — UserPromptSubmit enforcement hook
# Blocks @mention references to protected files before Claude sees their content.
# Manage with: /patronum-add /patronum-remove /patronum-list

set -euo pipefail

# Fail-open without jq — prompt hooks are best-effort
if ! command -v jq &> /dev/null; then
  exit 0
fi

# Fail closed if HOME is unset — no config path can be computed
if [ -z "${HOME:-}" ]; then
  echo "PATRONUM: HOME is unset — blocking prompt as safe default" >&2
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

# Fail-open for invalid config in prompt hooks (don't block all user input)
for _CFG in "${_ACTIVE_CONFIGS[@]}"; do
  if ! jq empty "$_CFG" 2>/dev/null; then
    exit 0
  fi
done
unset _CFG _ACTIVE_CONFIGS

INPUT=$(cat)

PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty')
[ -z "$PROMPT" ] && exit 0

# Extract @<path> tokens — everything after @ until whitespace, quote, or backtick
MENTIONS=$(echo "$PROMPT" | grep -oE '@[^[:space:]"'"'"'`]+' || true)
[ -z "$MENTIONS" ] && exit 0

while IFS= read -r MENTION; do
  [ -z "$MENTION" ] && continue
  RAW="${MENTION#@}"

  # Resolve to absolute path
  if [[ "$RAW" == /* ]]; then
    ABS_PATH="$RAW"
  elif [[ "$RAW" == ~* ]]; then
    ABS_PATH="${RAW/#\~/$HOME}"
  else
    ABS_PATH="${PWD}/${RAW}"
  fi

  # Check against file patterns (Bash patterns do not apply to file paths)
  while IFS=$'\t' read -r PATTERN REASON; do
    [ -z "$PATTERN" ] && continue
    [[ "$PATTERN" == Bash\(*\) ]] && continue

    EXPANDED_PATTERN="${PATTERN/#\~/$HOME}"
    # Replace **/ with */ for bash glob matching (single * already matches across / in [[ ]])
    EXPANDED_PATTERN="${EXPANDED_PATTERN//\*\*\//*/}"
    # Handle leading **/ patterns — also match bare filenames at any depth
    BASENAME_PATTERN=""
    [[ "$EXPANDED_PATTERN" == \*\/* ]] && BASENAME_PATTERN="${EXPANDED_PATTERN#\*/}"

    # shellcheck disable=SC2053
    if [[ "$ABS_PATH" == $EXPANDED_PATTERN ]]; then
      jq -n --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg tool "UserPromptSubmit" \
        --arg target "$MENTION" --arg pattern "$PATTERN" \
        '{ts:$ts,tool:$tool,target:$target,pattern:$pattern}' \
        >> "$PATRONUM_LOG" 2>/dev/null || true
      echo "PATRONUM_VIOLATION: @mention '$MENTION' references a protected file. Pattern: $PATTERN" >&2
      [ -n "$REASON" ] && echo "Reason: $REASON" >&2
      echo "Manage with: /patronum-add or /patronum-remove in Claude Code" >&2
      exit 2
    fi

    # Check basename pattern for ** rules (match files at any depth including root)
    if [ -n "$BASENAME_PATTERN" ]; then
      BN=$(basename "$ABS_PATH")
      # shellcheck disable=SC2053
      if [[ "$BN" == $BASENAME_PATTERN ]]; then
        jq -n --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg tool "UserPromptSubmit" \
          --arg target "$MENTION" --arg pattern "$PATTERN" \
          '{ts:$ts,tool:$tool,target:$target,pattern:$pattern}' \
          >> "$PATRONUM_LOG" 2>/dev/null || true
        echo "PATRONUM_VIOLATION: @mention '$MENTION' references a protected file. Pattern: $PATTERN" >&2
        [ -n "$REASON" ] && echo "Reason: $REASON" >&2
        echo "Manage with: /patronum-add or /patronum-remove in Claude Code" >&2
        exit 2
      fi
    fi
  done < <(patronum_entries)
done <<< "$MENTIONS"

exit 0
