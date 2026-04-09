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
- `scripts/patronum-*.js` — all Node.js scripts (hook, setup, add, remove, list, verify, uninstall)
- `scripts/lib/patronum.js` — shared library (config resolution, glob matching, utilities)
- `defaults/patronum.json` — default protection patterns shipped with plugin
- `skills/*/SKILL.md` — user-facing skills (per agentskills.io spec)
- `.claude/skills/*/SKILL.md` — dev-only skills (installed with plugin, prefixed `patronum-dev-`)
- `dev/skills/*/SKILL.md` — dev-only skills (NOT installed with plugin)
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
# Validate all JSON
node -e "['.claude-plugin/plugin.json','hooks/hooks.json','defaults/patronum.json'].forEach(f=>JSON.parse(require('fs').readFileSync(f,'utf8')))"

# Run self-test
CLAUDE_PLUGIN_ROOT="$(pwd)" node scripts/patronum-verify.js
```

### Documentation
```bash
cd docs && npm install    # Install dependencies
cd docs && npm run dev    # Start dev server
cd docs && npm run build  # Build for production
```

## Dependencies

- **Node.js** — JSON parsing and all script logic (guaranteed by Claude Code runtime)

## Best Practices

### Verify After Each Change
After modifying any script, run `CLAUDE_PLUGIN_ROOT="$(pwd)" node scripts/patronum-verify.js` to confirm behavior.

### Script Naming
All scripts are prefixed with `patronum-` to avoid name collisions with other plugins.

### Hook Exit Codes
- `exit 0` — allow the tool call
- `exit 2` — block the tool call (stderr message shown to Claude)

## Personality

You are a knowledgeable colleague, not someone who passively takes orders. Challenge ideas that could benefit from improvement. Push back on patterns that might cause false positives or miss real threats.
