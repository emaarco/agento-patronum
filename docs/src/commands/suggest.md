# /patronum-suggest

Analyze your project and suggest protection patterns based on your tech stack.

## Usage

```
/patronum-suggest
```

## How it works

1. Scans your project for config files (`package.json`, `go.mod`, `.tf` files, `docker-compose.yml`, etc.)
2. Checks what's already protected via `/patronum-list`
3. Suggests patterns that are **not yet protected**, with reasons
4. Asks for confirmation before adding anything

## Auto-invocation

Unlike other commands, `/patronum-suggest` can be invoked automatically by Claude when it detects relevant context — for example, when you mention a new cloud provider or start working with a tech stack that has known sensitive files.

## Example

```
User: "I'm starting work on a Terraform deployment for AWS"

Claude: [auto-invokes /patronum-suggest]
→ "I see you're working with Terraform and AWS. These aren't protected yet:
   - **/*.tfvars (Terraform variable files, often contain secrets)
   - **/*.tfstate (Terraform state, contains resource details)
   - **/.terraform/environment (workspace state)
   Should I add them?"

User: "Yes"
→ 3 patterns added.
```
