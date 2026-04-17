# patronum-add

Add a pattern to the blacklist (block) or whitelist (allow).

## Usage

Inside Claude Code, run:

```
/patronum-add "<pattern>" [--reason "reason"]
/patronum-add "plain English description of what to protect or allow"
```

By default, patterns are added to the **blacklist**. To add to the whitelist instead, use the `--whitelist` flag or describe your intent in natural language (e.g. "allow access to …").

## Examples

**Blacklist** — block agent access:

```
/patronum-add "~/.config/gcloud/credentials.db"
/patronum-add "**/*.tfvars" --reason "Terraform variables contain secrets"
/patronum-add "Bash(aws sts)" --reason "Blocks AWS session token commands"
```

**Whitelist** — explicitly allow access (overrides blacklist):

```
/patronum-add "**/.env.example" --whitelist --reason "Safe to read — no real secrets"
/patronum-add "allow access to .env.example files"
```

## Natural language input

You don't need to know glob syntax or flags. Describe what you want in plain English — patronum detects your intent:

```
/patronum-add I want to protect my terraform state files
/patronum-add keep my AWS credentials safe
/patronum-add allow Claude to read .env.example
/patronum-add trust all files in the fixtures/ directory
```

Intent keywords like **protect**, **block**, **hide** → blacklist.
Intent keywords like **allow**, **whitelist**, **permit**, **trust** → whitelist.

patronum will derive the right glob pattern(s), explain its reasoning, and ask you to confirm before adding anything.

## Behavior

- If no reason is provided, Claude will generate one based on the pattern
- Duplicate patterns within the same list are detected — adding an existing pattern is a no-op
- Overly broad patterns (like `*` or `**/*`) trigger a confirmation prompt
- The pattern takes effect immediately — no restart required
