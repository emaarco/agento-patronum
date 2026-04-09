# File Patterns

agento-patronum uses glob patterns to match file paths. When Claude Code tries to read, write, or edit a file, the hook checks the full file path against all configured patterns.

## Glob Syntax

| Pattern | Matches |
|---------|---------|
| `*` | Any sequence of characters (including `/` in path matching) |
| `?` | Any single character |
| `[abc]` | Any character in the set |
| `~` | Expands to `$HOME` before matching |

## Examples

These examples show how glob patterns match against file paths:

```json
{
  "pattern": "**/.env",
  "reason": "Environment files may contain credentials"
}
```

This blocks any file named `.env` at any directory depth:
- `/project/.env` — blocked
- `/project/backend/.env` — blocked
- `/project/.env.local` — **not blocked** (different name)

```json
{
  "pattern": "~/.ssh/*",
  "reason": "SSH directory contains private keys"
}
```

This blocks any file inside the SSH directory:
- `~/.ssh/id_rsa` — blocked
- `~/.ssh/config` — blocked
- `~/.ssh/known_hosts` — blocked

## How matching works

1. The hook receives the full file path from Claude Code (e.g. `/Users/you/.ssh/id_rsa`)
2. `~` in patterns is expanded to `$HOME`
3. `**/` is normalized for deep path matching
4. The glob is converted to a regular expression and tested against the full path
5. First match wins — the file is blocked

## @mention protection

File patterns also apply to `@file` mentions in user prompts (e.g. `@stack/.env.local`). Claude Code injects `@mention` file content directly into the conversation context before any tool call fires, so a dedicated `UserPromptSubmit` hook checks `@` references before Claude processes the prompt.

If `@stack/.env.local` matches `**/.env.*`, the prompt is blocked and Claude never sees the file contents — the same outcome as blocking a `Read` tool call.
