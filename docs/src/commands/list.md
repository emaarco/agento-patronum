# patronum-list

Show all patterns currently active in agento-patronum.

## Usage

Inside Claude Code, run:

```
/patronum-list
```

## Output

Displays two labeled sections — blacklist and whitelist — each with a table:

| Column | Description |
|--------|-------------|
| **Pattern** | The glob pattern or Bash command |
| **Source** | `default` (shipped with plugin) or `user` (added manually) |
| **Reason** | Why this pattern is blocked or allowed |

Patterns in the whitelist override matching blacklist entries — see [Schema](/reference/schema) for enforcement order.
