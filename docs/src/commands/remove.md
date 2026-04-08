# patronum-remove

Remove a pattern from the protection list.

## Usage

Inside Claude Code, run:

```
/patronum-remove "<pattern>"
```

## Examples

Remove a pattern by specifying its exact string:

```
/patronum-remove "**/*.pem"
/patronum-remove "~/.npmrc"
```

## Behavior

- If you don't specify an exact pattern, Claude will show the current list first
- Removing a default pattern is permanent — it won't come back on plugin update
- The change takes effect immediately
