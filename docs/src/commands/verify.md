# patronum-verify

Run a self-test to verify that hook enforcement is working correctly.

## Usage

Inside Claude Code, run:

```
/patronum-verify
```

## What it tests

The verify command simulates tool calls and checks whether the hook blocks or allows them correctly:

- **Should block**: `~/.ssh/id_rsa`, `.env`, `~/.aws/credentials`, `printenv`, `.pem` files
- **Should allow**: Safe file paths, safe commands

## When to use

- After first install (to confirm setup worked)
- After modifying patterns (to confirm no regressions)
- When something seems off (to diagnose issues)

## Troubleshooting

If tests fail, the command checks:

1. Is `jq` installed?
2. Does `~/.claude/patronum.json` exist?
3. Is the JSON valid?
4. Are the hook scripts accessible?
