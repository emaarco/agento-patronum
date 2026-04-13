---
name: patronum-suggest
description: "Suggest protection patterns based on project context. Invoke automatically when user mentions a new tech stack, cloud provider, or sensitive tooling. Also invoke when user asks what to protect."
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/management/patronum-list.js"), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/management/patronum-add.js" *), Glob, AskUserQuestion, WebSearch
---

# Skill: patronum-suggest

Analyze the current project and suggest relevant protection patterns.

## Steps

### 1. Detect tech stack

Use `Glob` to list files in the project. Do NOT read file contents — infer the stack from file names and paths alone.

Signals to look for:
- `package.json` → Node.js / npm
- `go.mod` → Go
- `requirements.txt`, `pyproject.toml`, `Pipfile` → Python
- `Gemfile` → Ruby
- `Cargo.toml` → Rust
- `**/*.tf` → Terraform
- `docker-compose.yml`, `Dockerfile` → Docker
- `.gcloud/`, `.azure/` directories → GCP / Azure
- `.github/workflows/*.yml`, `.gitlab-ci.yml` → CI/CD
- `pom.xml`, `build.gradle` → Java / Gradle / Maven
- `*.kubeconfig`, `kubeconfig` → Kubernetes

### 2. Research sensitive files

Use `WebSearch` to find known sensitive files, credential paths, and secret locations for the detected technologies. Search for patterns like:
- "[technology] sensitive files credentials path"
- "[cloud provider] local config files secrets"

This ensures suggestions cover technology-specific risks beyond the hardcoded list.

### 3. Check current protections

Run: `node "${CLAUDE_PLUGIN_ROOT}/scripts/management/patronum-list.js"` to see what is already protected.

### 4. Build suggestions

Based on detected stack and web research, suggest patterns that are NOT yet protected. Common suggestions include:
- **Terraform**: `**/*.tfvars`, `**/*.tfstate`, `**/.terraform/environment`
- **GCP**: `~/.config/gcloud/credentials.db`, `**/service-account*.json`
- **Azure**: `~/.azure/accessTokens.json`, `~/.azure/msal_token_cache.json`
- **Ruby**: `~/.gem/credentials`
- **Gradle/Maven**: `~/.gradle/gradle.properties`, `~/.m2/settings.xml`
- **Kubernetes**: `**/kubeconfig`, `**/*.kubeconfig`
- **Vault**: `~/.vault-token`
- **GPG**: `~/.gnupg/*`

Include any additional patterns discovered via web search.

### 5. Confirm with user

Use `AskUserQuestion` to present the suggestions as a formatted list with reasons.
Let the user select which patterns to add.

### 6. Add confirmed patterns

For each confirmed pattern, run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/management/patronum-add.js" "<pattern>" --reason "<reason>"
```

Present the final updated protection list as a markdown table.
