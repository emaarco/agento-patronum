# Why Hooks (not settings.json)

Claude Code supports `permissions.deny` rules in `settings.json`. In theory, these should block access to specified files. In practice, they don't work reliably.

## The problem

`settings.json` deny rules are **frequently ignored**. This is a confirmed bug — Claude Code sometimes silently bypasses deny rules, especially for:

- Nested paths
- Glob patterns
- Bash tool calls

This means relying on `settings.json` for security is a false sense of protection.

## The solution

**PreToolUse hooks** are the only reliable enforcement layer. A hook runs as a shell script before every tool call. It receives the tool name and input as JSON on stdin, and can:

- **Allow** the call (exit 0)
- **Block** the call (exit 2, with reason on stderr)

Claude Code **cannot bypass hooks** — they are enforced at the runtime level, not the prompt level.

::: info Why agento-patronum uses both
agento-patronum uses hooks as the primary enforcement layer. In a future version, it may also write `settings.json` deny rules as a secondary best-effort layer — belt and suspenders. But hooks are what actually protect you.
:::
