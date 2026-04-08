#!/usr/bin/env bash
# agento-patronum — PreToolUse enforcement hook
# Blocks access to files and commands matching protected patterns.
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

PATRONUM_CONFIG="$HOME/.claude/patronum.json"
PATRONUM_LOG="$HOME/.claude/patronum.log"

# If no config exists, allow everything
if [ ! -f "$PATRONUM_CONFIG" ]; then
  exit 0
fi

# Fail closed if config is not valid JSON
if ! jq empty "$PATRONUM_CONFIG" 2>/dev/null; then
  echo "PATRONUM: config file is invalid JSON — blocking all tool calls as safe default" >&2
  exit 2
fi

# Read hook input from stdin
INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
if [ -z "$TOOL_NAME" ]; then
  exit 0
fi

# Extract target based on tool type
TARGET=""
case "$TOOL_NAME" in
  Bash)
    COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
    if [ -n "$COMMAND" ]; then
      TARGET="Bash($COMMAND)"
    fi
    ;;
  Read|Write|Edit)
    TARGET=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
    ;;
  MultiEdit)
    # MultiEdit uses an edits array — check each file path individually
    while IFS= read -r EDIT_PATH; do
      [ -z "$EDIT_PATH" ] && continue
      EXPANDED_EDIT="${EDIT_PATH/#\~/$HOME}"
      # Re-use the full pattern-check logic by setting TARGET and running checks inline
      # We exit 2 immediately if any edit path matches a protected pattern
      while IFS=$'\t' read -r PATTERN REASON; do
        [ -z "$PATTERN" ] && continue
        [[ "$PATTERN" == Bash\(*\) ]] && continue
        EP="${PATTERN/#\~/$HOME}"
        EP="${EP//\*\*\//*/}"
        BP=""
        [[ "$EP" == \*\/* ]] && BP="${EP#\*/}"
        # shellcheck disable=SC2053
        if [[ "$EXPANDED_EDIT" == $EP ]]; then
          jq -n --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg tool "$TOOL_NAME" \
            --arg target "$EDIT_PATH" --arg pattern "$PATTERN" \
            '{ts:$ts,tool:$tool,target:$target,pattern:$pattern}' \
            >> "$PATRONUM_LOG" 2>/dev/null || true
          echo "PATRONUM_VIOLATION: Access to '$EDIT_PATH' blocked. Pattern: $PATTERN" >&2
          [ -n "$REASON" ] && echo "Reason: $REASON" >&2
          echo "Manage with: /patronum-add or /patronum-remove in Claude Code" >&2
          exit 2
        fi
        if [ -n "$BP" ]; then
          BN=$(basename "$EXPANDED_EDIT")
          # shellcheck disable=SC2053
          if [[ "$BN" == $BP ]]; then
            jq -n --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg tool "$TOOL_NAME" \
              --arg target "$EDIT_PATH" --arg pattern "$PATTERN" \
              '{ts:$ts,tool:$tool,target:$target,pattern:$pattern}' \
              >> "$PATRONUM_LOG" 2>/dev/null || true
            echo "PATRONUM_VIOLATION: Access to '$EDIT_PATH' blocked. Pattern: $PATTERN" >&2
            [ -n "$REASON" ] && echo "Reason: $REASON" >&2
            echo "Manage with: /patronum-add or /patronum-remove in Claude Code" >&2
            exit 2
          fi
        fi
      done < <(jq -r '.entries[] | [.pattern, .reason] | @tsv' "$PATRONUM_CONFIG")
    done < <(echo "$INPUT" | jq -r '.tool_input.edits[]?.file_path // empty')
    exit 0
    ;;
  *)
    exit 0
    ;;
esac

if [ -z "$TARGET" ]; then
  exit 0
fi

# Expand ~ in target
EXPANDED_TARGET="${TARGET/#\~/$HOME}"

# Emit a violation log entry and block the tool call
block_violation() {
  local TARGET="$1" PATTERN="$2" REASON="$3"
  jq -n --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg tool "$TOOL_NAME" \
    --arg target "$TARGET" --arg pattern "$PATTERN" \
    '{ts:$ts,tool:$tool,target:$target,pattern:$pattern}' \
    >> "$PATRONUM_LOG" 2>/dev/null || true
  echo "PATRONUM_VIOLATION: Access to '$TARGET' blocked. Pattern: $PATTERN" >&2
  [ -n "$REASON" ] && echo "Reason: $REASON" >&2
  echo "Manage with: /patronum-add or /patronum-remove in Claude Code" >&2
  exit 2
}

# Check each pattern
while IFS=$'\t' read -r PATTERN REASON; do
  [ -z "$PATTERN" ] && continue

  # For Bash commands, check if the command starts with the blocked command
  if [[ "$PATTERN" == Bash\(*\) ]]; then
    BLOCKED_CMD="${PATTERN#Bash(}"
    BLOCKED_CMD="${BLOCKED_CMD%)}"
    if [[ "$TARGET" == Bash\(*\) ]]; then
      ACTUAL_CMD="${TARGET#Bash(}"
      ACTUAL_CMD="${ACTUAL_CMD%)}"
      # Check if the actual command starts with or equals the blocked command
      if [[ "$ACTUAL_CMD" == "$BLOCKED_CMD" || "$ACTUAL_CMD" == "$BLOCKED_CMD "* ]]; then
        block_violation "$TARGET" "$PATTERN" "$REASON"
      fi
    fi
    continue
  fi

  # For file patterns, expand ~ and use glob matching
  EXPANDED_PATTERN="${PATTERN/#\~/$HOME}"
  # Replace **/ with */ for bash glob matching (single * already matches across / in [[ ]])
  EXPANDED_PATTERN="${EXPANDED_PATTERN//\*\*\//*/}"
  # Handle leading **/ patterns — also match bare filenames at any depth
  if [[ "$EXPANDED_PATTERN" == \*\/* ]]; then
    BASENAME_PATTERN="${EXPANDED_PATTERN#\*/}"
  fi

  # shellcheck disable=SC2053
  if [[ "$EXPANDED_TARGET" == $EXPANDED_PATTERN ]]; then
    block_violation "$TARGET" "$PATTERN" "$REASON"
  fi

  # Check basename pattern for ** rules (match files at any depth including root)
  if [ -n "${BASENAME_PATTERN:-}" ]; then
    BASENAME_OF_TARGET=$(basename "$EXPANDED_TARGET")
    # shellcheck disable=SC2053
    if [[ "$BASENAME_OF_TARGET" == $BASENAME_PATTERN ]]; then
      block_violation "$TARGET" "$PATTERN" "$REASON"
    fi
  fi
  unset BASENAME_PATTERN

done < <(jq -r '.entries[] | [.pattern, .reason] | @tsv' "$PATRONUM_CONFIG")

exit 0
