#!/usr/bin/env bash
# agento-patronum — UserPromptSubmit hook
# Lazy init guard: ensures setup has run even when SessionStart hasn't fired
# (e.g. after /plugin install + /reload-plugins without a full session restart).

set -euo pipefail

USER_CONFIG="${HOME}/.claude/patronum/patronum.json"

# Fast path: already initialized
[[ -f "$USER_CONFIG" ]] && exit 0

# Lazy init: plugin was loaded but SessionStart hasn't fired yet.
# Run setup now so protection is active this session.
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
bash "${PLUGIN_ROOT}/scripts/patronum-setup.sh"
