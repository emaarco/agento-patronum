---
name: patronum-add
argument-hint: "\"<pattern>\" [--whitelist] [--reason \"reason\"]"
description: "Add a file pattern or command to the agento-patronum protection list (blacklist) or allowed list (whitelist). Use when the user wants to block or explicitly allow access to a file, path, or command."
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/management/patronum-add.js" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/management/patronum-list.js"), AskUserQuestion
---

# Skill: patronum-add

Add a pattern to the agento-patronum blacklist (block) or whitelist (allow).

## Steps

### 1. Parse input

Parse the user's input from `$ARGUMENTS`. Determine two things: the **pattern** and the **target list**.

#### Target list detection

If the user's intent uses words like "allow", "whitelist", "permit", "trust", "safe to access", or "let Claude read", they want the **whitelist**. Add `--whitelist` to the command.

If the intent uses words like "protect", "block", "hide", "deny", "prevent", or "restrict", they want the **blacklist** (default).

#### Pattern detection: two input modes

**Mode A — Exact glob or path** (e.g. `**/*.tfstate` or `~/.aws/credentials`):
Use it directly as the pattern. If no `--reason` is provided, generate a short one.

**Mode B — Natural language intent** (e.g. `I want to protect my terraform state files`):
Detect that the input is not a glob/path (no `/`, `*`, `~`, or `.**` characters, or it reads as a sentence).
Derive one or more appropriate glob patterns from the intent. Common mappings:
- "terraform state" → `**/*.tfstate`, `**/*.tfstate.backup`
- "AWS credentials / secrets" → `~/.aws/credentials`, `~/.aws/config`
- "environment variables / .env" → `**/.env`, `**/.env.*`
- "private keys / SSH" → `**/*.pem`, `**/*.key`, `~/.ssh/*`
- "docker credentials" → `~/.docker/config.json`
- For anything not in the list above, reason from the technology/domain to derive a sensible glob.

### 2. Confirm with user

Always confirm via `AskUserQuestion` — never skip this step regardless of input mode. Present:
- The pattern(s) to be added
- Whether it will go to the **blacklist** (block) or **whitelist** (allow)
- The reason (provided or generated)
- A warning if the pattern looks overly broad (e.g. `*`, `**/*`, or very short globs)

### 3. Add the pattern

After the user confirms, run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/management/patronum-add.js" $ARGUMENTS
```

Include `--whitelist` in the arguments if the user wants to allow access.

### 4. Present result

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/management/patronum-list.js"` and present the updated protection list, showing both the blacklist and whitelist sections. Highlight the newly added entry.
