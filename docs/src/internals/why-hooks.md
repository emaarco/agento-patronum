# Why Hooks (not settings.json)

> For the big picture — why this tool exists and how it compares to alternatives — see [Why patronum](/internals/why-patronum).

Claude Code has a built-in `permissions.deny` mechanism in `settings.json`. It's the obvious first choice — but a growing number of community reports suggest it doesn't hold up well in practice.

## The problem with settings.json

Issues have been filed across a range of scenarios: file reads, file writes, Bash commands, sub-agents, symlink traversal, and even managed settings from the Anthropic Console:

- [Critical Security Bug: deny permissions in settings.json are not enforced](https://github.com/anthropics/claude-code/issues/6699)
- [Permission Deny Configuration Not Enforced for Read/Write Tools](https://github.com/anthropics/claude-code/issues/6631)
- [Sub-agents bypass permission deny rules and per-command approval](https://github.com/anthropics/claude-code/issues/25000)
- [Read deny permissions in settings.json not enforced for .env files](https://github.com/anthropics/claude-code/issues/24846)
- [Permission Deny Bypass Through Symbolic Links](https://github.com/anthropics/claude-code/security/advisories/GHSA-4q92-rfm6-2cqx) (security advisory)
- [Deny permission rules not blocking commands, falling through to ask](https://github.com/anthropics/claude-code/issues/27547)

Not all of these may still be reproducible — but the breadth of the pattern is hard to dismiss. When you're protecting credentials or sensitive files, "usually works" isn't enough.

## Why hooks are a better fit

`PreToolUse` hooks run as an executable before every tool call — a shell script, a Node script, a Python script, whatever fits your setup. They receive the tool name and input as JSON on stdin, and the response is simple:

- **exit 0** — allow the call
- **exit 2** — block it, with a reason on stderr

What makes this more than just another deny mechanism is visibility. Every blocked call is explicit and logged — you know exactly what fired, when, and why. There's no silent fallthrough, no ambiguity about whether a rule was applied.

Unlike a passive config rule, a hook is code you own — you decide what runs, what blocks, and what gets logged.

## Further reading

- [Hooks Guide](https://docs.anthropic.com/en/docs/claude-code/hooks-guide) — practical introduction, common patterns, and lifecycle overview
- [Hooks Reference](https://docs.anthropic.com/en/docs/claude-code/hooks) — complete technical reference: configuration schema, input/output formats, exit codes, matcher syntax, and all hook event types
