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

PATRONUM_CONFIG="$HOME/.claude/patronum.json"
PATRONUM_LOG="$HOME/.claude/patronum.log"

# If no config exists, allow everything
if [ ! -f "$PATRONUM_CONFIG" ]; then
  exit 0
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
  Read|Write|Edit|MultiEdit)
    TARGET=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
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
        # Log the violation
        echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"tool\":\"$TOOL_NAME\",\"target\":\"$TARGET\",\"pattern\":\"$PATTERN\"}" \
          >> "$PATRONUM_LOG" 2>/dev/null || true
        echo "PATRONUM_VIOLATION: Access blocked. Pattern: $PATTERN" >&2
        [ -n "$REASON" ] && echo "Reason: $REASON" >&2
        echo "Manage with: /patronum-add or /patronum-remove in Claude Code" >&2
        exit 2
      fi
    fi
    continue
  fi

  # For file patterns, expand ~ and use glob matching
  EXPANDED_PATTERN="${PATTERN/#\~/$HOME}"
  # Replace **/ with */ for bash glob matching (single * already matches across / in [[ ]])
  EXPANDED_PATTERN="${EXPANDED_PATTERN//\*\*\//*\/}"
  # Handle leading ** (e.g. "**/.env" → "*/.env" but also match ".env" at root)
  if [[ "$EXPANDED_PATTERN" == \*\/* ]]; then
    # Also check without the leading */ prefix (matches at current directory level)
    BASENAME_PATTERN="${EXPANDED_PATTERN#\*/}"
  fi

  # shellcheck disable=SC2053
  if [[ "$EXPANDED_TARGET" == $EXPANDED_PATTERN ]]; then
    echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"tool\":\"$TOOL_NAME\",\"target\":\"$TARGET\",\"pattern\":\"$PATTERN\"}" \
      >> "$PATRONUM_LOG" 2>/dev/null || true
    echo "PATRONUM_VIOLATION: Access to '$TARGET' blocked. Pattern: $PATTERN" >&2
    [ -n "$REASON" ] && echo "Reason: $REASON" >&2
    echo "Manage with: /patronum-add or /patronum-remove in Claude Code" >&2
    exit 2
  fi

  # Check basename pattern for ** rules (match files at any depth including root)
  if [ -n "${BASENAME_PATTERN:-}" ]; then
    BASENAME_OF_TARGET=$(basename "$EXPANDED_TARGET")
    # shellcheck disable=SC2053
    if [[ "$BASENAME_OF_TARGET" == $BASENAME_PATTERN ]]; then
      echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"tool\":\"$TOOL_NAME\",\"target\":\"$TARGET\",\"pattern\":\"$PATTERN\"}" \
        >> "$PATRONUM_LOG" 2>/dev/null || true
      echo "PATRONUM_VIOLATION: Access to '$TARGET' blocked. Pattern: $PATTERN" >&2
      [ -n "$REASON" ] && echo "Reason: $REASON" >&2
      echo "Manage with: /patronum-add or /patronum-remove in Claude Code" >&2
      exit 2
    fi
  fi
  unset BASENAME_PATTERN

done < <(jq -r '.entries[] | [.pattern, .reason] | @tsv' "$PATRONUM_CONFIG")

exit 0
