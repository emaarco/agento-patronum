# Agent Instructions

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

agento-patronum is a Claude Code plugin that protects sensitive files, credentials, and commands from unintended AI access. It works via PreToolUse hooks — the only reliable enforcement layer in Claude Code (settings.json deny rules are confirmed buggy).

Install via Claude Code marketplace:
```bash
/plugin marketplace add emaarco/agento-patronum
/plugin install agento-patronum@emaarco
```

## Architecture

### Plugin Structure
- `.claude-plugin/plugin.json` — marketplace manifest
- `hooks/hooks.json` — registers SessionStart + PreToolUse hooks
- `scripts/patronum-*.sh` — all shell scripts (hook, setup, add, remove, list, verify)
- `defaults/patronum.json` — default protection patterns shipped with plugin
- `skills/*/SKILL.md` — slash commands for end users
- `docs/` — VitePress documentation site

### How It Works
1. On install, `hooks.json` registers a SessionStart hook and a PreToolUse hook
2. SessionStart runs `patronum-setup.sh` which copies default patterns to `~/.claude/patronum.json`
3. Every Read/Write/Edit/Bash call goes through `patronum-hook.sh`
4. The hook checks the file path or command against patterns in `~/.claude/patronum.json`
5. If a pattern matches, the hook exits with code 2 (blocks the tool) and logs to `~/.claude/patronum.log`

### Key Files
- `~/.claude/patronum.json` — user's protection config (persists across plugin updates)
- `~/.claude/patronum.log` — JSONL audit log of blocked actions

## Common Commands

### Validate
```bash
# Check all scripts compile
bash -n scripts/patronum-*.sh

# Validate all JSON
jq empty .claude-plugin/plugin.json hooks/hooks.json defaults/patronum.json

# Run self-test
CLAUDE_PLUGIN_ROOT="$(pwd)" bash scripts/patronum-verify.sh
```

### Documentation
```bash
cd docs && npm install    # Install dependencies
cd docs && npm run dev    # Start dev server
cd docs && npm run build  # Build for production
```

## Dependencies

- **bash** — all scripts
- **jq** — JSON parsing and manipulation (no python3 dependency)

## Best Practices

### Verify After Each Change
After modifying any script, run `bash -n` and `patronum-verify.sh` to confirm syntax and behavior.

### Script Naming
All scripts are prefixed with `patronum-` to avoid name collisions with other plugins.

### Hook Exit Codes
- `exit 0` — allow the tool call
- `exit 2` — block the tool call (stderr message shown to Claude)

## Personality

You are a knowledgeable colleague, not someone who passively takes orders. Challenge ideas that could benefit from improvement. Push back on patterns that might cause false positives or miss real threats.
