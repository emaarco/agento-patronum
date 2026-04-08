---
name: patronum-add
argument-hint: "\"<pattern>\" [--reason \"reason\"]"
description: "Add a file pattern or command to the agento-patronum protection list. Use when the user wants to block access to a file, path, or command."
disable-model-invocation: true
allowed-tools: Bash(bash "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-add.sh" *)
---

# Skill: patronum-add

Add the following pattern to the protection list: $ARGUMENTS

## Steps

1. Parse the user's input. Expect a pattern and an optional `--reason`.
   - If no reason is provided, generate a short reason based on what the pattern protects.
2. Run: `bash "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-add.sh" $ARGUMENTS`
3. Confirm what was added.
4. If the pattern looks unusual or overly broad (e.g. `*` or `**/*`), ask the user to confirm before running.
