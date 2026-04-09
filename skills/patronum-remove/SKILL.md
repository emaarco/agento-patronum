---
name: patronum-remove
argument-hint: "\"<pattern>\""
description: "Remove a pattern from the agento-patronum protection list. Use when the user wants to unblock access to a file or command."
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-remove.js" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-list.js"), AskUserQuestion
---

# Skill: patronum-remove

Remove a protection pattern from the agento-patronum shield.

## Steps

### 1. Show current protections

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-list.js"` to get all current patterns.

### 2. Identify the pattern to remove

Match the user's request from $ARGUMENTS against the current list.
If the match is ambiguous or no exact match is found, present the full list and ask the user to clarify.

### 3. Confirm removal

Use `AskUserQuestion` to confirm the removal. Present:
- The exact pattern to be removed
- Its source (`default` or `user`) and reason
- A warning if removing a default pattern — it won't come back unless manually re-added

### 4. Remove the pattern

After the user confirms, run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-remove.js" "$ARGUMENTS"
```

### 5. Present updated list

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-list.js"` again and present the updated protection list as a markdown table:

| Pattern | Source | Reason |
|---------|--------|--------|
