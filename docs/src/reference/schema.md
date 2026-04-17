# patronum.json Schema

The protection config is stored at `~/.claude/patronum/patronum.json`.

## Full schema

The config file contains a blacklist, a whitelist, and a version field:

```json
{
  "blacklist": [
    {
      "pattern": "**/.env",
      "type": "glob",
      "reason": "Environment files may contain credentials",
      "addedAt": "2026-04-08T10:00:00Z",
      "source": "default"
    }
  ],
  "whitelist": [
    {
      "pattern": "**/.env.example",
      "type": "glob",
      "reason": "Safe to read — no real secrets",
      "addedAt": "2026-04-17T10:00:00Z",
      "source": "user"
    }
  ],
  "version": "2"
}
```

## Fields

### Entry fields

Both `blacklist` and `whitelist` entries share the same structure:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pattern` | string | yes | Glob pattern or `Bash(<command>)` format |
| `type` | string | yes | Always `"glob"` |
| `reason` | string | yes | Human-readable explanation |
| `addedAt` | string | yes | ISO 8601 UTC timestamp |
| `source` | string | yes | `"default"` (shipped) or `"user"` (added manually) |

### Root fields

| Field | Type | Description |
|-------|------|-------------|
| `blacklist` | array | Patterns that block agent access |
| `whitelist` | array | Patterns that explicitly allow access (override blacklist) |
| `version` | string | Schema version (`"2"`) |

## Enforcement order

1. If the target matches any **whitelist** pattern → **allow** (blacklist is skipped)
2. If the target matches any **blacklist** pattern → **block**
3. Otherwise → **allow**

This lets you protect a broad pattern (e.g. `**/.env.*`) while carving out specific exceptions (e.g. `**/.env.example`).

## File location

| Path | Purpose |
|------|---------|
| `~/.claude/patronum/patronum.json` | User config (survives plugin updates) |
| `defaults/patronum.json` | Plugin defaults (copied on first setup) |
