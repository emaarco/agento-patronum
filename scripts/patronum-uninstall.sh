#!/usr/bin/env bash
# agento-patronum — Remove all patronum data files
# Usage: bash scripts/patronum-uninstall.sh
#
# This script removes patronum config and log files only.
# To also remove the plugin itself, run first:
#   claude plugin uninstall agento-patronum@emaarco

set -euo pipefail

REMOVED=0

# ── User-scope config (~/.claude/patronum/) ───────────────────────────────────
PATRONUM_DIR="$HOME/.claude/patronum"
if [ -d "$PATRONUM_DIR" ]; then
  CONFIG_FILE="$PATRONUM_DIR/patronum.json"
  COUNT="unknown"
  if [ -f "$CONFIG_FILE" ]; then
    COUNT=$(jq '.entries | length' "$CONFIG_FILE" 2>/dev/null || echo "unknown")
  fi
  rm -rf "$PATRONUM_DIR"
  echo "agento-patronum: removed $PATRONUM_DIR ($COUNT patterns in user config)"
  REMOVED=$((REMOVED + 1))
else
  echo "agento-patronum: no user config found at $PATRONUM_DIR"
fi

# ── Repo-scope config (.claude/patronum/ inside git repo) ────────────────────
_GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [ -n "$_GIT_ROOT" ]; then
  _REPO_PATRONUM="$_GIT_ROOT/.claude/patronum"
  if [ -d "$_REPO_PATRONUM" ]; then
    rm -rf "$_REPO_PATRONUM"
    echo "agento-patronum: removed repo config at $_REPO_PATRONUM"
    REMOVED=$((REMOVED + 1))
  else
    echo "agento-patronum: no repo config found at $_REPO_PATRONUM"
  fi
  unset _REPO_PATRONUM
else
  echo "agento-patronum: not inside a git repo — skipping repo-scope cleanup"
fi
unset _GIT_ROOT

# ── Summary ───────────────────────────────────────────────────────────────────
if [ "$REMOVED" -gt 0 ]; then
  echo ""
  echo "agento-patronum: data cleanup complete."
  echo "To finish uninstalling, run: claude plugin uninstall agento-patronum@emaarco"
else
  echo "agento-patronum: nothing to clean up."
fi
