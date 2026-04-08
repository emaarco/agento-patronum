# patronum-list

Show all patterns currently protected by agento-patronum.

## Usage

Inside Claude Code, run:

```
/patronum-list
```

## Output

Displays a table with three columns:

| Column | Description |
|--------|-------------|
| **Pattern** | The glob pattern or Bash command |
| **Source** | `default` (shipped with plugin) or `user` (added manually) |
| **Reason** | Why this pattern is protected |
