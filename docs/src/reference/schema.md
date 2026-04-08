# patronum.json Schema

The protection config is stored at `~/.claude/patronum.json`.

## Full schema

The config file contains an array of protection entries and a version field:

```json
{
  "entries": [
    {
      "pattern": "**/.env",
      "type": "glob",
      "reason": "Environment files may contain credentials",
      "addedAt": "2026-04-08T10:00:00Z",
      "source": "default"
    }
  ],
  "version": "1"
}
```

## Fields

### Entry fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pattern` | string | yes | Glob pattern or `Bash(<command>)` format |
| `type` | string | yes | Always `"glob"` in v1 |
| `reason` | string | yes | Human-readable explanation |
| `addedAt` | string | yes | ISO 8601 UTC timestamp |
| `source` | string | yes | `"default"` (shipped) or `"user"` (added manually) |

### Root fields

| Field | Type | Description |
|-------|------|-------------|
| `entries` | array | List of protection entries |
| `version` | string | Schema version (currently `"1"`) |

## File location

| Path | Purpose |
|------|---------|
| `~/.claude/patronum.json` | User config (survives plugin updates) |
| `defaults/patronum.json` | Plugin defaults (copied on first setup) |
