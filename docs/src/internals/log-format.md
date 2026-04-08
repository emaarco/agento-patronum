# Log Format

Every blocked tool call is logged to `~/.claude/patronum.log` in JSONL format (one JSON object per line).

## Format

```json
{"ts":"2026-04-08T10:30:00Z","tool":"Read","target":"/Users/you/.ssh/id_rsa","pattern":"~/.ssh/*"}
```

| Field | Description |
|-------|-------------|
| `ts` | UTC timestamp of the blocked call |
| `tool` | The tool that was blocked (`Read`, `Write`, `Edit`, `Bash`, etc.) |
| `target` | The file path or command that was blocked |
| `pattern` | The pattern that matched |

## Viewing logs

```bash
# Last 10 blocked calls
tail -10 ~/.claude/patronum.log

# Watch in real time
tail -f ~/.claude/patronum.log

# Pretty-print with jq
cat ~/.claude/patronum.log | jq .

# Count blocks by pattern
cat ~/.claude/patronum.log | jq -r .pattern | sort | uniq -c | sort -rn
```

::: info Why JSONL
JSONL (one JSON object per line) is append-friendly — the hook can write a new line without reading the entire file. It's also easy to process with `jq`, `grep`, and standard Unix tools.
:::
