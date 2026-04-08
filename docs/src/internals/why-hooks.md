# Why Hooks (not settings.json)

Claude Code supports `permissions.deny` rules in `settings.json`. In theory, these should block access to specified files. In practice, they don't work reliably.

## The problem

`settings.json` deny rules are **frequently ignored**. This is not a theoretical concern — it's a well-documented issue with multiple reports:

- [Critical Security Bug: deny permissions in settings.json are not enforced](https://github.com/anthropics/claude-code/issues/6699)
- [Permission Deny Configuration Not Enforced for Read/Write Tools](https://github.com/anthropics/claude-code/issues/6631)
- [Sub-agents bypass permission deny rules and per-command approval](https://github.com/anthropics/claude-code/issues/25000)
- [Read deny permissions in settings.json not enforced for .env files](https://github.com/anthropics/claude-code/issues/24846)
- [Permission Deny Bypass Through Symbolic Links](https://github.com/anthropics/claude-code/security/advisories/GHSA-4q92-rfm6-2cqx) (security advisory)
- [Deny permission rules not blocking commands, falling through to ask](https://github.com/anthropics/claude-code/issues/27547)

The bypass affects file read/write patterns, Bash command execution, sub-agents, and even managed settings configured in the Anthropic Console. Relying on `settings.json` for security gives a false sense of protection.

## The solution

**PreToolUse hooks** are the only reliable enforcement layer. A hook runs as a shell script before every tool call. It receives the tool name and input as JSON on stdin, and can:

- **Allow** the call (exit 0)
- **Block** the call (exit 2, with reason on stderr)

Claude Code **cannot bypass hooks** — they are enforced at the runtime level, not the prompt level.
