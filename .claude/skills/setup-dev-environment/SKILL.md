---
name: setup-dev-environment
description: "Set up the agento-patronum development environment. Check prerequisites, install docs dependencies, validate plugin structure."
disable-model-invocation: true
allowed-tools: Bash(which *), Bash(bash -n *), Bash(jq *), Bash(cd * && npm *), Bash(npm *)
---

# Skill: setup-dev-environment

Set up the local development environment for agento-patronum.

## Steps

### 1. Check prerequisites

Verify the following tools are available:

```bash
which bash    # Required: shell scripts
which jq      # Required: JSON processing
which node    # Required: VitePress docs
which npm     # Required: VitePress docs
```

If any are missing, tell the user how to install them.

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
bash -n scripts/patronum-setup.sh
bash -n scripts/patronum-hook.sh
bash -n scripts/patronum-add.sh
bash -n scripts/patronum-remove.sh
bash -n scripts/patronum-list.sh
bash -n scripts/patronum-verify.sh

# Scripts are executable
test -x scripts/patronum-hook.sh
```

### 4. Run self-test

```bash
CLAUDE_PLUGIN_ROOT="$(pwd)" bash scripts/patronum-verify.sh
```

### 5. Report

Summarize what was checked and whether everything passed.
