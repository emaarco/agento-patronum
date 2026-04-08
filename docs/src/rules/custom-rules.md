# Custom Rules

The default patterns cover the most common sensitive files. Add your own to match your stack — or remove defaults that don't fit your workflow.

## Adding patterns

Use `/patronum-add` inside Claude Code:

```
/patronum-add "~/.config/gcloud/credentials.db" --reason "GCP credentials"
/patronum-add "**/*.tfvars" --reason "Terraform variables may contain secrets"
/patronum-add "Bash(vault token)" --reason "HashiCorp Vault tokens"
```

## Removing patterns

Use `/patronum-remove` to delete a pattern:

```
/patronum-remove "**/*.tfvars"
```

::: warning
Removing a default pattern is permanent. It won't come back unless you re-add it manually.
:::

## Viewing your patterns

Use `/patronum-list` to see everything currently protected:

```
/patronum-list
```

Shows all patterns with their source (`default` or `user`) and reason.

## Pattern tips

- **Be specific**: `~/.aws/credentials` is better than `~/.aws/*` (which would also block `~/.aws/cli/cache`)
- **Use `**/` for recursive matching**: `**/.env` matches `.env` at any depth
- **Test after adding**: Run `/patronum-verify` to confirm the hook still passes
- **Bash commands**: Use the `Bash(<command>)` format to block specific commands

## Where patterns are stored

Your patterns live at `~/.claude/patronum.json`. This file is user-owned and persists across plugin updates. You can edit it directly, but using the slash commands is recommended.
