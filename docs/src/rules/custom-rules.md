# Custom Rules

The default patterns cover the most common sensitive files. Add your own to match your stack — or remove defaults that don't fit your workflow.

## Adding to the blacklist

Use `/patronum-add` to block access to a file or command:

```
/patronum-add "~/.config/gcloud/credentials.db" --reason "GCP credentials"
/patronum-add "**/*.tfvars" --reason "Terraform variables may contain secrets"
/patronum-add "Bash(vault token)" --reason "HashiCorp Vault tokens"
```

## Adding to the whitelist

Use `/patronum-add --whitelist` to explicitly allow access — even if a blacklist pattern would otherwise block it:

```
/patronum-add "**/.env.example" --whitelist --reason "Safe to read — no real secrets"
/patronum-add "allow access to fixtures/.env.test" 
```

Whitelist entries take priority over blacklist entries. This lets you protect a broad pattern while carving out specific exceptions.

## Removing patterns

Use `/patronum-remove` to delete a pattern from either list — the command searches both automatically:

```
/patronum-remove "**/*.tfvars"
/patronum-remove "**/.env.example"
```

::: warning
Removing a default pattern is permanent. It won't come back unless you re-add it manually.
:::

## Viewing your patterns

Use `/patronum-list` to see everything currently active:

```
/patronum-list
```

Shows blacklist and whitelist sections, each with pattern, source (`default` or `user`), and reason.

## Pattern tips

- **Be specific**: `~/.aws/credentials` is better than `~/.aws/*` (which would also block `~/.aws/cli/cache`)
- **Use `**/` for recursive matching**: `**/.env` matches `.env` at any depth
- **Test after adding**: Run `/patronum-verify` to confirm the hook still passes
- **Bash commands**: Use the `Bash(<command>)` format to block specific commands

## Where patterns are stored

Your patterns live at `~/.claude/patronum/patronum.json`. This file is user-owned and persists across plugin updates. You can edit it directly, but using the slash commands is recommended.
