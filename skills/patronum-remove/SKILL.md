---
name: patronum-remove
argument-hint: "\"<pattern>\""
description: "Remove a pattern from the agento-patronum protection list. Use when the user wants to unblock access to a file or command."
disable-model-invocation: true
allowed-tools: Bash(bash "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-remove.sh" *), Bash(bash "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-list.sh")
---

# Skill: patronum-remove

Remove the following pattern from the protection list: $ARGUMENTS

## Steps

1. If the user didn't specify an exact pattern, run `patronum-list.sh` first to show available patterns.
2. Run: `bash "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-remove.sh" "$ARGUMENTS"`
3. Confirm what was removed.
4. Warn the user if removing a default pattern — it won't come back unless they re-add it.
