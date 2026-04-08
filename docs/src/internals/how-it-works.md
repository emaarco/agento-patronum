# How It Works

## Hook flow

```
Claude Code → Tool Call → PreToolUse Hook → patronum-hook.sh
                                                  │
                                    ┌─────────────┼─────────────┐
                                    │             │             │
                               Read/Write/    Bash tool    Other tools
                               Edit/MultiEdit     │             │
                                    │             │          exit 0
                                    │             │         (allow)
                                    ▼             ▼
                              Extract         Wrap as
                              file_path      Bash(command)
                                    │             │
                                    └──────┬──────┘
                                           │
                                           ▼
                                  Check against patterns
                                  in ~/.claude/patronum.json
                                           │
                                    ┌──────┴──────┐
                                    │             │
                                 Match         No match
                                    │             │
                                    ▼             ▼
                              Log + exit 2     exit 0
                              (block)         (allow)
```

## What the hook receives

The hook reads JSON from stdin:

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
