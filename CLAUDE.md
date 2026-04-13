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
- `hooks/hooks.json` — registers SessionStart + PreToolUse + UserPromptSubmit hooks
- `scripts/hooks/patronum-*-hook.js` — enforcement hook scripts (file, bash, prompt)
- `scripts/management/patronum-*.js` — blacklist CRUD + verification (add, remove, list, verify)
- `scripts/setup/patronum-*.js` — lifecycle scripts (setup, uninstall, install-check)
- `scripts/lib/config.js` — config resolution, loading, and blacklist helpers
- `scripts/lib/matching.js` — glob pattern matching
- `scripts/lib/io.js` — stdin reading utilities
- `scripts/lib/logging.js` — violation logging
- `scripts/**/*.test.js` — unit tests (node:test), co-located with implementation files
- `scripts/validate-json.js` — JSON validation script (used in CI)
- `defaults/patronum.json` — default protection patterns shipped with plugin
- `skills/*/SKILL.md` — user-facing skills (per agentskills.io spec)
- `.claude/skills/*/SKILL.md` — dev-only skills (installed with plugin, prefixed `patronum-dev-`)
- `e2e/` — integration test scripts
- `docs/` — VitePress documentation site

### How It Works
1. On install, `hooks.json` registers a SessionStart hook, UserPromptSubmit hooks, and PreToolUse hooks
2. SessionStart runs `patronum-setup.js` which copies default patterns to `~/.claude/patronum/patronum.json`
3. Each hook script is self-contained: it loads config, parses stdin, calls its enforce function, and handles the violation/exit logic inline
4. The enforce function checks the file path, command, or @mention against patterns in the config
5. If a pattern matches, the hook exits with code 2 (blocks the tool) and logs to `~/.claude/patronum/patronum.log`

### Key Files
- `~/.claude/patronum/patronum.json` — user's protection config (persists across plugin updates)
- `~/.claude/patronum/patronum.log` — JSONL audit log of blocked actions

## Common Commands

### Validate
```bash
# Run unit tests
node --test $(find scripts -name '*.test.js')

# Run integration self-test
CLAUDE_PLUGIN_ROOT="$(pwd)" node scripts/setup/patronum-setup.js
CLAUDE_PLUGIN_ROOT="$(pwd)" node scripts/management/patronum-verify.js

# Validate all JSON
node scripts/validate-json.js
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
After modifying any script, run `node --test $(find scripts -name '*.test.js')` for unit tests and `CLAUDE_PLUGIN_ROOT="$(pwd)" node scripts/management/patronum-verify.js` for integration smoke tests.

### Script Naming
All scripts are prefixed with `patronum-` to avoid name collisions with other plugins.

### Hook Exit Codes
- `exit 0` — allow the tool call
- `exit 2` — block the tool call (stderr message shown to Claude)

## Personality

You are a knowledgeable colleague, not someone who passively takes orders. Challenge ideas that could benefit from improvement. Push back on patterns that might cause false positives or miss real threats.
