# How It Works

agento-patronum registers hooks via Claude Code's plugin system. Three focused hooks work together to cover every path a protected file can travel.

## Hook overview

| Hook event | Script | What it intercepts |
|---|---|---|
| `PreToolUse` (file) | `patronum-file-hook.sh` | `Read`, `Write`, `Edit`, `MultiEdit` tool calls |
| `PreToolUse` (Bash) | `patronum-bash-hook.sh` | `Bash` tool calls |
| `UserPromptSubmit` | `patronum-prompt-hook.sh` | `@mention` references in user prompts |

File patterns only ever run against file paths. Bash patterns only ever run against commands. This separation prevents false positives where a filename appearing as text in a shell argument would incorrectly trigger a file rule.

## Hook flow

The diagram below shows the core interception pipeline — from Claude Code issuing a tool call to the final allow/block decision.

<div style="margin-top: 1.5rem;">

![Hook flow diagram: Claude Code calls a tool, the Patronum hook intercepts it, checks against patterns in patronum.json, and either blocks or allows the call.](/hook-flow.svg)

</div>

**Step by step:**

1. **Claude Code issues a tool call** (e.g. `Read ~/.ssh/id_rsa` or `Bash printenv`)
2. **The matching PreToolUse hook** intercepts the call before it executes
3. **Pattern matching** checks the target against all entries in `~/.claude/patronum.json`
4. If a pattern matches: the call is **blocked** (exit code 2) and logged to `~/.claude/patronum.log`
5. If no pattern matches: the call is **allowed** (exit code 0) and proceeds normally

## What the file hook receives

```json
{
  "tool_name": "Read",
  "tool_input": {
    "file_path": "/Users/you/.ssh/id_rsa"
  }
}
```

## What the Bash hook receives

```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "printenv"
  }
}
```

## Pattern matching

For **file patterns**, the hook:
1. Expands `~` to `$HOME` in both the pattern and the target path
2. Normalizes `**/` for bash glob matching
3. Uses bash's `[[ $target == $pattern ]]` for glob comparison

For **Bash commands**, the hook:
1. Checks if the command starts with the blocked command string
2. Only `Bash(...)` pattern entries are tested — file glob patterns are never applied to command strings

## Blocking

When a pattern matches:
- Logs the violation to `~/.claude/patronum.log` (JSONL)
- Prints the violation reason to stderr (shown to Claude)
- Exits with code 2 (tells Claude Code to block the tool call or prompt)

## @mention interception

`PreToolUse` covers tool calls — but there is a second path a file can travel.

Claude Code lets you reference files inline using `@` syntax:

```
whats in @stack/.env.local
```

This is intentionally useful: instead of letting Claude search for and read files on its own, you hand it exactly the context it needs upfront. Fewer tool calls, less token usage, faster responses, tighter scope.

The catch — when you send this, Claude Code **injects the file contents directly into the conversation context** before the agent even starts — no `Read` tool call is ever issued. This means `PreToolUse` hooks never fire, and without additional protection the file lands in the conversation silently.

To close this gap, patronum registers a `UserPromptSubmit` hook that intercepts the raw prompt before Claude processes it. `patronum-prompt-hook.sh` receives:

```json
{
  "hook_event_name": "UserPromptSubmit",
  "prompt": "whats in @stack/.env.local"
}
```

It extracts every `@<path>` token, resolves each to an absolute path, and checks it against the same file patterns used by the file hook. If a match is found, the prompt is blocked with exit code 2 before Claude processes it.

## Dependencies

All hooks use only `bash` and `jq` — no language runtimes, no npm packages, no dependencies beyond what's listed in [Prerequisites](/getting-started/installation#prerequisites).
