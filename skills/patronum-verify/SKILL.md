---
name: patronum-verify
description: "Run agento-patronum self-test to verify hook enforcement is working."
disable-model-invocation: true
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-verify.js")
---

# Skill: patronum-verify

Run the agento-patronum self-test.

## Steps

1. Run: `node "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-verify.js"`
2. Present the results to the user.
3. If any tests fail, help the user diagnose the issue:
   - Check if `node` is available
   - Check if `~/.claude/patronum.json` exists and is valid JSON
   - Suggest running setup again if files are missing
