---
name: patronum-suggest
description: "Suggest protection patterns based on project context. Invoke automatically when user mentions a new tech stack, cloud provider, or sensitive tooling. Also invoke when user asks what to protect."
allowed-tools: Bash(bash "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-list.sh"), Bash(bash "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-add.sh" *), Glob, Read
---

# Skill: patronum-suggest

Analyze the current project context and suggest relevant protection patterns.

## Steps

1. Check what tech stack and cloud tools are in use. Look at:
   - `package.json`, `go.mod`, `requirements.txt`, `Gemfile`, `Cargo.toml`
   - `.tf` files (Terraform), `docker-compose.yml`, `Dockerfile`
   - `.gcloud/`, `.azure/`, cloud config directories
   - CI/CD files (`.github/workflows/`, `.gitlab-ci.yml`)

2. Run: `bash "${CLAUDE_PLUGIN_ROOT}/scripts/patronum-list.sh"` to see what is already protected.

3. Based on the detected stack, suggest patterns that are NOT yet protected. Common suggestions:
   - **Terraform**: `**/*.tfvars`, `**/*.tfstate`, `**/.terraform/environment`
   - **GCP**: `~/.config/gcloud/credentials.db`, `**/service-account*.json`
   - **Azure**: `~/.azure/accessTokens.json`, `~/.azure/msal_token_cache.json`
   - **Ruby**: `~/.gem/credentials`
   - **Gradle/Maven**: `~/.gradle/gradle.properties`, `~/.m2/settings.xml`
   - **Kubernetes**: `**/kubeconfig`, `**/*.kubeconfig`
   - **Vault**: `~/.vault-token`
   - **GPG**: `~/.gnupg/*`

4. Present suggestions with reasons. Ask: "Should I add these?"

5. Only add patterns after explicit user confirmation. Use `patronum-add.sh` for each.
