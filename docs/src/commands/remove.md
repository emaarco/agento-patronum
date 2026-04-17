# patronum-remove

Remove a pattern from the blacklist or whitelist.

## Usage

Inside Claude Code, run:

```
/patronum-remove "<pattern>"
```

## Examples

```
/patronum-remove "**/*.pem"
/patronum-remove "~/.npmrc"
/patronum-remove "**/.env.example"
```

## Behavior

- If you don't specify an exact pattern, Claude will show the current list first
- The command searches both the blacklist and whitelist automatically — no flag needed
- Removing a default pattern is permanent — it won't come back on plugin update
- The change takes effect immediately
