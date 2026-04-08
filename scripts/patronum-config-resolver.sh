#!/usr/bin/env bash
# agento-patronum — Shared config path resolver
# Source this file to set PATRONUM_DIR, PATRONUM_CONFIG, PATRONUM_LOG
#
# Priority:
#   1. ~/.claude/patronum/projects/<project-id>.json  (if in a git repo and file exists)
#   2. ~/.claude/patronum/user.json                   (user-level fallback)

PATRONUM_DIR="$HOME/.claude/patronum"
PATRONUM_CONFIG="$PATRONUM_DIR/user.json"
PATRONUM_LOG="$PATRONUM_DIR/user.log"

_PATRONUM_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [ -n "$_PATRONUM_ROOT" ]; then
  _PATRONUM_ID=$(echo "$_PATRONUM_ROOT" | tr '/' '_' | sed 's/^_//')
  _PATRONUM_PROJ_CONFIG="$PATRONUM_DIR/projects/$_PATRONUM_ID.json"
  if [ -f "$_PATRONUM_PROJ_CONFIG" ]; then
    PATRONUM_CONFIG="$_PATRONUM_PROJ_CONFIG"
    PATRONUM_LOG="$PATRONUM_DIR/projects/$_PATRONUM_ID.log"
  fi
  unset _PATRONUM_ID _PATRONUM_PROJ_CONFIG
fi
unset _PATRONUM_ROOT
