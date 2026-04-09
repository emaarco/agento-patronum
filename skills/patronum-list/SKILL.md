---
name: patronum-list
description: "Show all patterns currently protected by agento-patronum."
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-list.js")
---

# Skill: patronum-list

Show all active protection patterns.

## Steps

### 1. Fetch patterns

Run: `node "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-list.js"`

### 2. Present as themed table

Format the output as a markdown table with the following columns, consistent with the documentation at `docs/src/commands/list.md`:

**Protection Shield**

| Pattern | Source | Reason |
|---------|--------|--------|
| `**/.env` | default | Environment files may contain credentials |
| ... | ... | ... |

Group patterns by source (`default` first, then `user`) for readability.
Show the total count at the end.

### 3. If empty

If no patterns are configured, suggest:
- Use `/patronum-suggest` to get stack-specific recommendations
- Use `/patronum-add` to manually add patterns
