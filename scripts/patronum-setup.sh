#!/usr/bin/env bash
# agento-patronum — SessionStart hook
# Copies default config on first run. Safe to run every session.

set -euo pipefail

# Check for jq dependency
if ! command -v jq &> /dev/null; then
  echo "ERROR: jq is required but not installed." >&2
  echo "Install with:" >&2
  echo "  macOS:  brew install jq" >&2
  echo "  Linux:  apt install jq (Debian/Ubuntu) or yum install jq (RHEL/CentOS)" >&2
  echo "  WSL:    apt install jq" >&2
  exit 1
fi

PATRONUM_DIR="$HOME/.claude/patronum"
CONFIG_FILE="$PATRONUM_DIR/patronum.json"
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
if [ -z "${CLAUDE_PLUGIN_ROOT:-}" ]; then
  echo "agento-patronum: warning: CLAUDE_PLUGIN_ROOT not set, using fallback path: $PLUGIN_ROOT" >&2
fi
DEFAULTS="$PLUGIN_ROOT/defaults/patronum.json"

# Ensure user config directory exists
mkdir -p "$PATRONUM_DIR"

# Initialise user config if missing
if [ ! -f "$CONFIG_FILE" ]; then
  cp "$DEFAULTS" "$CONFIG_FILE"
  echo "agento-patronum: first-time setup complete. Default protections installed."
fi

# Detect project-scope or local-scope install and create the appropriate repo config
_GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [ -n "$_GIT_ROOT" ]; then
  _PATRONUM_REPO_DIR="$_GIT_ROOT/.claude/patronum"

  # Project scope: agento-patronum listed in committed .claude/settings.json
  if [ -f "$_GIT_ROOT/.claude/settings.json" ] && \
     jq -e '(.enabledPlugins // {}) | to_entries[] | select(.key | startswith("agento-patronum")) | .value' \
         "$_GIT_ROOT/.claude/settings.json" 2>/dev/null | grep -q true; then
    mkdir -p "$_PATRONUM_REPO_DIR"
    if [ ! -f "$_PATRONUM_REPO_DIR/patronum.json" ]; then
      cp "$DEFAULTS" "$_PATRONUM_REPO_DIR/patronum.json"
      echo "agento-patronum: project-scope install detected."
      echo "agento-patronum: created $_PATRONUM_REPO_DIR/patronum.json with default protections."
      echo "agento-patronum: commit this file to share protection rules with your team."
      echo "agento-patronum: add .claude/patronum/patronum.log to your .gitignore."
    fi
  fi

  # Local scope: agento-patronum listed in gitignored .claude/settings.local.json
  if [ -f "$_GIT_ROOT/.claude/settings.local.json" ] && \
     jq -e '(.enabledPlugins // {}) | to_entries[] | select(.key | startswith("agento-patronum")) | .value' \
         "$_GIT_ROOT/.claude/settings.local.json" 2>/dev/null | grep -q true; then
    mkdir -p "$_PATRONUM_REPO_DIR"
    if [ ! -f "$_PATRONUM_REPO_DIR/patronum.local.json" ]; then
      cp "$DEFAULTS" "$_PATRONUM_REPO_DIR/patronum.local.json"
      echo "agento-patronum: local-scope install detected."
      echo "agento-patronum: created $_PATRONUM_REPO_DIR/patronum.local.json with default protections."
      echo "agento-patronum: this file is personal — add it to your .gitignore."
    fi
  fi

  unset _PATRONUM_REPO_DIR
fi
unset _GIT_ROOT

COUNT=$(jq '.entries | length' "$CONFIG_FILE")
echo "agento-patronum: protection active. $COUNT patterns loaded."
