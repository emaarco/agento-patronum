---
name: patronum-verify
description: "Run agento-patronum self-test to verify hook enforcement is working."
disable-model-invocation: true
allowed-tools: Bash(bash "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-verify.sh")
---

# Skill: patronum-verify

Run the agento-patronum self-test.

## Steps

1. Run: `bash "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-verify.sh"`
2. Present the results to the user.
3. If any tests fail, help the user diagnose the issue:
   - Check if `jq` is installed
   - Check if `~/.claude/patronum.json` exists and is valid JSON
   - Suggest running setup again if files are missing
