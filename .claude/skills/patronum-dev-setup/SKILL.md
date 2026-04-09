---
name: patronum-dev-setup
description: "Set up the agento-patronum development environment. Check prerequisites, install docs dependencies, validate plugin structure."
disable-model-invocation: true
allowed-tools: Bash(which *), Bash(node *), Bash(cd * && npm *), Bash(npm *)
---

# Skill: patronum-dev-setup

Set up the local development environment for agento-patronum.

## Steps

### 1. Check prerequisites

Verify the following tools are available:

```bash
which bash    # Required: shell runtime
which node    # Required: plugin scripts + VitePress docs
which npm     # Required: VitePress docs
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
node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json','utf8'))" && echo "plugin.json OK"
node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json','utf8'))" && echo "hooks.json OK"
node -e "JSON.parse(require('fs').readFileSync('defaults/patronum.json','utf8'))" && echo "patronum.json OK"

# Script syntax
for f in scripts/patronum-*.js; do
  node -c "$f" && echo "$f OK"
done
```

### 4. Run self-test

```bash
CLAUDE_PLUGIN_ROOT="$(pwd)" node scripts/patronum-verify.js
```

### 5. Report

Summarize what was checked and whether everything passed.
