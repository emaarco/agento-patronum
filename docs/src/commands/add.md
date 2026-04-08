# /patronum-add

Add a pattern to the protection list.

## Usage

```
/patronum-add "<pattern>" [--reason "reason"]
```

## Examples

```
/patronum-add "~/.config/gcloud/credentials.db"
/patronum-add "**/*.tfvars" --reason "Terraform variables contain secrets"
/patronum-add "Bash(aws sts)" --reason "Blocks AWS session token commands"
```

## Behavior

- If no reason is provided, Claude will generate one based on the pattern
- Duplicate patterns are detected — adding an existing pattern is a no-op
- Overly broad patterns (like `*` or `**/*`) trigger a confirmation prompt
- The pattern takes effect immediately — no restart required
