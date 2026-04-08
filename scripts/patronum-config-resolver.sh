#!/usr/bin/env bash
# agento-patronum — Shared config path resolver
# Source this file to set PATRONUM_DIR, PATRONUM_USER_CONFIG, PATRONUM_PROJ_CONFIG,
# PATRONUM_CONFIG, and PATRONUM_LOG.
#
# Both configs are active simultaneously (merged):
#   PATRONUM_USER_CONFIG  ~/.claude/patronum/patronum.json  (always loaded — personal rules)
#   PATRONUM_PROJ_CONFIG  .claude/patronum/patronum.json    (loaded when present — team rules)
#
# PATRONUM_CONFIG points to the config that add/remove/list operations target:
#   → project config when present, user config otherwise

PATRONUM_DIR="$HOME/.claude/patronum"
PATRONUM_USER_CONFIG="$PATRONUM_DIR/patronum.json"
PATRONUM_PROJ_CONFIG=""
PATRONUM_CONFIG="$PATRONUM_USER_CONFIG"
PATRONUM_LOG="$PATRONUM_DIR/patronum.log"

_PATRONUM_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [ -n "$_PATRONUM_ROOT" ]; then
  _PROJ_CONFIG="$_PATRONUM_ROOT/.claude/patronum/patronum.json"
  if [ -f "$_PROJ_CONFIG" ]; then
    PATRONUM_PROJ_CONFIG="$_PROJ_CONFIG"
    PATRONUM_CONFIG="$_PROJ_CONFIG"
    PATRONUM_LOG="$_PATRONUM_ROOT/.claude/patronum/patronum.log"
  fi
  unset _PROJ_CONFIG
fi
unset _PATRONUM_ROOT
