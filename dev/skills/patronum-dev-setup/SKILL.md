---
name: patronum-dev-setup
description: "Set up the agento-patronum development environment. Check prerequisites, install docs dependencies, validate plugin structure."
disable-model-invocation: true
allowed-tools: Bash(which *), Bash(bash -n *), Bash(jq *), Bash(cd * && npm *), Bash(npm *)
---

# Skill: patronum-dev-setup

Set up the local development environment for agento-patronum.

## Steps

### 1. Check prerequisites

Verify the following tools are available:

```bash
which bash    # Required: shell scripts
which jq      # Required: JSON processing (CRITICAL)
which node    # Required: VitePress docs
which npm     # Required: VitePress docs
```

**jq is critical** — without it, the hook cannot function. If missing, provide install instructions:

```bash
# macOS
brew install jq

# Linux
apt install jq  # Debian/Ubuntu
yum install jq  # RHEL/CentOS

# WSL
apt install jq
```

If any tool is missing, tell the user how to install it and do not proceed.

### 2. Install docs dependencies

```bash
cd docs && npm install
```

### 3. Validate plugin structure

Run all validation checks:

```bash
# JSON validity
jq empty .claude-plugin/plugin.json
jq empty hooks/hooks.json
jq empty defaults/patronum.json

# Bash syntax
for f in scripts/patronum-*.sh; do
  bash -n "$f" && echo "$f OK"
done
```

### 4. Run self-test

```bash
CLAUDE_PLUGIN_ROOT="$(pwd)" bash scripts/patronum-verify.sh
```

### 5. Report

Summarize what was checked and whether everything passed.
