# How It Works

agento-patronum registers a `PreToolUse` hook via Claude Code's plugin system. This hook runs as a shell script **before every tool call** — intercepting `Read`, `Write`, `Edit`, `MultiEdit`, and `Bash` operations before they execute.

## Hook flow

The diagram below shows the complete interception pipeline — from Claude Code issuing a tool call to the final allow/block decision.

<div style="margin-top: 1.5rem;">

![Hook flow diagram: Claude Code calls a tool, the PreToolUse hook intercepts it, checks against patterns in patronum.json, and either blocks or allows the call.](/hook-flow.svg)

</div>

**Step by step:**

1. **Claude Code** issues a tool call (e.g. `Read ~/.ssh/id_rsa` or `Bash printenv`)
2. **The PreToolUse hook** (`patronum-hook.sh`) intercepts the call before it executes
3. **Pattern matching** checks the target file path or command against all entries in `~/.claude/patronum.json`
4. If a pattern matches: the call is **blocked** (exit code 2) and logged to `~/.claude/patronum.log`
5. If no pattern matches: the call is **allowed** (exit code 0) and proceeds normally

## What the hook receives

The hook reads JSON from stdin. For file operations:

```json
{
  "tool_name": "Read",
  "tool_input": {
    "file_path": "/Users/you/.ssh/id_rsa"
  }
}
```

For Bash tools:

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
1. Wraps the command as `Bash(<command>)`
2. Checks if the command starts with the blocked command string

## Blocking

When a pattern matches:
- Logs the violation to `~/.claude/patronum.log` (JSONL)
- Prints the violation reason to stderr (shown to Claude)
- Exits with code 2 (tells Claude Code to block the tool call)

## Dependencies

The hook uses only `bash` and `jq` — no python, no node, no external binaries.
