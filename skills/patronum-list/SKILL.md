---
name: patronum-list
description: "Show all patterns currently protected by agento-patronum."
disable-model-invocation: true
allowed-tools: Bash(bash "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-list.sh")
---

# Skill: patronum-list

List all protected patterns.

## Steps

1. Run: `bash "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-list.sh"`
2. Present the output to the user.
