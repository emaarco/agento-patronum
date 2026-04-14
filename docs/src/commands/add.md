# patronum-add

Add a pattern to the protection list.

## Usage

Inside Claude Code, run:

```
/patronum-add "<pattern>" [--reason "reason"]
/patronum-add "plain English description of what to protect"
```

## Examples

Common patterns you might want to protect:

```
/patronum-add "~/.config/gcloud/credentials.db"
/patronum-add "**/*.tfvars" --reason "Terraform variables contain secrets"
/patronum-add "Bash(aws sts)" --reason "Blocks AWS session token commands"
```

## Natural language input

You don't need to know glob syntax. Describe what you want to protect in plain English:

```
/patronum-add I want to protect my terraform state files
/patronum-add keep my AWS credentials safe
/patronum-add protect environment variable files
```

patronum will derive the right glob pattern(s), explain its reasoning, and ask you to confirm before adding anything.

## Behavior

- If no reason is provided, Claude will generate one based on the pattern
- Duplicate patterns are detected — adding an existing pattern is a no-op
- Overly broad patterns (like `*` or `**/*`) trigger a confirmation prompt
- The pattern takes effect immediately — no restart required
