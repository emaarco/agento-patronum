# Bash Commands

agento-patronum can block specific Bash commands, not just file paths. This prevents Claude from running commands that expose environment variables or secrets.

## How it works

When Claude uses the `Bash` tool, the hook wraps the command as `Bash(<command>)` and checks it against patterns.

A pattern like `Bash(printenv)` blocks any Bash tool call where the command starts with `printenv`:
- `printenv` — blocked
- `printenv SECRET_KEY` — blocked
- `echo $SECRET_KEY` — **not blocked** (different command)

## Default blocked commands

| Pattern | What it blocks |
|---------|---------------|
| `Bash(printenv)` | Dumps all environment variables |
| `Bash(env)` | Dumps all environment variables |
| `Bash(set)` | Dumps all shell variables and functions |

## Adding custom command blocks

```
/patronum-add "Bash(cat /etc/shadow)" --reason "Password hashes"
/patronum-add "Bash(aws sts)" --reason "AWS session tokens"
```

## Limitations

Command matching checks if the actual command **starts with** the blocked command string. This means:

- `Bash(env)` blocks `env` and `env | grep SECRET` but not `echo env`
- The match is prefix-based — it won't catch commands buried in pipes or subshells
- For comprehensive Bash protection, combine command blocks with file pattern blocks
