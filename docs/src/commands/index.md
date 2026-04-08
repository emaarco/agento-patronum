# Slash Commands

All management of agento-patronum happens via slash commands inside Claude Code.

| Command | Description |
|---------|-------------|
| [`/patronum-add`](./add) | Add a pattern to the protection list |
| [`/patronum-remove`](./remove) | Remove a pattern from the protection list |
| [`/patronum-list`](./list) | Show all protected patterns |
| [`/patronum-suggest`](./suggest) | Get stack-specific protection suggestions |
| [`/patronum-verify`](./verify) | Run self-test to verify hook enforcement |

## How they work

Each slash command is a `SKILL.md` file that instructs Claude to call the corresponding shell script via the Bash tool. The scripts read and write `~/.claude/patronum.json`.

No external binary, no API calls — everything runs locally in your shell.
