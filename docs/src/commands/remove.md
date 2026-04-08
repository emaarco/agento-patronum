# /patronum-remove

Remove a pattern from the protection list.

## Usage

```
/patronum-remove "<pattern>"
```

## Examples

```
/patronum-remove "**/*.pem"
/patronum-remove "~/.npmrc"
```

## Behavior

- If you don't specify an exact pattern, Claude will show the current list first
- Removing a default pattern is permanent — it won't come back on plugin update
- The change takes effect immediately
