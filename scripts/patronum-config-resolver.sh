#!/usr/bin/env bash
# agento-patronum — Shared config path resolver
# Source this file to get PATRONUM_USER_CONFIG, PATRONUM_PROJ_CONFIG,
# PATRONUM_LOCAL_REPO_CONFIG, PATRONUM_CONFIG, and PATRONUM_LOG.
#
# All present configs are merged by the hook:
#   PATRONUM_USER_CONFIG       ~/.claude/patronum/patronum.json        always loaded (personal)
#   PATRONUM_PROJ_CONFIG       .claude/patronum/patronum.json          team rules (committed)
#   PATRONUM_LOCAL_REPO_CONFIG .claude/patronum/patronum.local.json    personal repo rules (gitignored)
#
# PATRONUM_CONFIG = the config that add/remove/list operations write to:
#   project config if present, else local repo config if present, else user config

PATRONUM_DIR="$HOME/.claude/patronum"
PATRONUM_USER_CONFIG="$PATRONUM_DIR/patronum.json"
PATRONUM_PROJ_CONFIG=""
PATRONUM_LOCAL_REPO_CONFIG=""
PATRONUM_CONFIG="$PATRONUM_USER_CONFIG"
PATRONUM_LOG="$PATRONUM_DIR/patronum.log"

_PATRONUM_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [ -n "$_PATRONUM_ROOT" ]; then
  _PROJ="$_PATRONUM_ROOT/.claude/patronum/patronum.json"
  _LOCAL="$_PATRONUM_ROOT/.claude/patronum/patronum.local.json"
  if [ -f "$_PROJ" ]; then
    PATRONUM_PROJ_CONFIG="$_PROJ"
    PATRONUM_CONFIG="$_PROJ"
    PATRONUM_LOG="$_PATRONUM_ROOT/.claude/patronum/patronum.log"
  fi
  if [ -f "$_LOCAL" ]; then
    PATRONUM_LOCAL_REPO_CONFIG="$_LOCAL"
    [ -z "$PATRONUM_PROJ_CONFIG" ] && PATRONUM_CONFIG="$_LOCAL"
    [ -z "$PATRONUM_PROJ_CONFIG" ] && PATRONUM_LOG="$_PATRONUM_ROOT/.claude/patronum/patronum.log"
  fi
  unset _PROJ _LOCAL
fi
unset _PATRONUM_ROOT
