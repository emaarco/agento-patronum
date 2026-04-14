---
name: patronum-add
argument-hint: "\"<pattern>\" [--reason \"reason\"]"
description: "Add a file pattern or command to the agento-patronum protection list. Use when the user wants to block access to a file, path, or command."
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/management/patronum-add.js" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/management/patronum-list.js"), AskUserQuestion
---

# Skill: patronum-add

Add a protection pattern to the agento-patronum shield.

## Steps

### 1. Parse input

Parse the user's input from `$ARGUMENTS`. Two input modes are supported:

**Mode A — Exact glob or path** (e.g. `**/*.tfstate` or `~/.aws/credentials`):
Use it directly as the pattern. If no `--reason` is provided, generate a short one.
Always proceed to Step 2 to confirm with the user via `AskUserQuestion` before adding.

**Mode B — Natural language intent** (e.g. `I want to protect my terraform state files`):
Detect that the input is not a glob/path (no `/`, `*`, `~`, or `.**` characters, or it reads as a sentence).
Derive one or more appropriate glob patterns from the intent. Common mappings:
- "terraform state" → `**/*.tfstate`, `**/*.tfstate.backup`
- "AWS credentials / secrets" → `~/.aws/credentials`, `~/.aws/config`
- "environment variables / .env" → `**/.env`, `**/.env.*`
- "private keys / SSH" → `**/*.pem`, `**/*.key`, `~/.ssh/*`
- "docker credentials" → `~/.docker/config.json`
- For anything not in the list above, reason from the technology/domain to derive a sensible glob.

Present the derived pattern(s) and generated reason via `AskUserQuestion` (Step 2) so the user can approve before anything is written.

**Both modes always go through the Step 2 confirmation — never skip it.**

### 2. Confirm with user

Use `AskUserQuestion` to confirm the addition. Present:
- The pattern to be added
- The reason (provided or generated)
- A warning if the pattern looks overly broad (e.g. `*`, `**/*`, or very short globs)

### 3. Add the pattern

After the user confirms, run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/management/patronum-add.js" $ARGUMENTS
```

### 4. Present result

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/management/patronum-list.js"` and present the updated protection list as a markdown table:

| Pattern | Source | Reason |
|---------|--------|--------|

Highlight the newly added entry.
