#!/usr/bin/env bash
# agento-patronum — Shared config path resolver
# Source this file to set PATRONUM_DIR, PATRONUM_CONFIG, PATRONUM_LOG
#
# Priority:
#   1. .claude/patronum/patronum.json  (git repo root, committed — project/team config)
#   2. ~/.claude/patronum/user.json    (machine-local — user config fallback)

PATRONUM_DIR="$HOME/.claude/patronum"
PATRONUM_CONFIG="$PATRONUM_DIR/user.json"
PATRONUM_LOG="$PATRONUM_DIR/user.log"

_PATRONUM_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [ -n "$_PATRONUM_ROOT" ]; then
  _PROJ_CONFIG="$_PATRONUM_ROOT/.claude/patronum/patronum.json"
  if [ -f "$_PROJ_CONFIG" ]; then
    PATRONUM_CONFIG="$_PROJ_CONFIG"
    PATRONUM_LOG="$_PATRONUM_ROOT/.claude/patronum/patronum.log"
  fi
  unset _PROJ_CONFIG
fi
unset _PATRONUM_ROOT
