---
name: patronum-add
argument-hint: "\"<pattern>\" [--reason \"reason\"]"
description: "Add a file pattern or command to the agento-patronum protection list. Use when the user wants to block access to a file, path, or command."
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-add.js" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-list.js"), AskUserQuestion
---

# Skill: patronum-add

Add a protection pattern to the agento-patronum shield.

## Steps

### 1. Parse input

Parse the user's input from $ARGUMENTS. Expect a pattern and an optional `--reason`.
If no reason is provided, generate a short reason based on what the pattern protects.

### 2. Confirm with user

Use `AskUserQuestion` to confirm the addition. Present:
- The pattern to be added
- The reason (provided or generated)
- A warning if the pattern looks overly broad (e.g. `*`, `**/*`, or very short globs)

### 3. Add the pattern

After the user confirms, run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-add.js" $ARGUMENTS
```

### 4. Present result

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-list.js"` and present the updated protection list as a markdown table:

| Pattern | Source | Reason |
|---------|--------|--------|

Highlight the newly added entry.
