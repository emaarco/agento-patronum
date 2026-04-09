---
name: patronum-dev-add-default-pattern
argument-hint: "\"<pattern>\" --reason \"<reason>\""
description: "Add a new default pattern to defaults/patronum.json with correct schema and validation."
disable-model-invocation: true
allowed-tools: Read, Edit, Bash(node *), Bash(CLAUDE_PLUGIN_ROOT=* node scripts/patronum-verify.js)
---

# Skill: patronum-dev-add-default-pattern

Add a new pattern to the default protection list shipped with the plugin.

## Steps

### 1. Read current defaults

```bash
Read defaults/patronum.json
```

### 2. Validate the proposed pattern

- Check it's not already in the defaults
- Check the pattern syntax is valid (glob or Bash command format)
- Check a reason is provided

### 3. Add the entry

Edit `defaults/patronum.json` to add the new entry with the correct schema:

```json
{
  "pattern": "<pattern>",
  "type": "glob",
  "reason": "<reason>",
  "addedAt": "<current ISO timestamp>",
  "source": "default"
}
```

### 4. Validate JSON

```bash
node -e "JSON.parse(require('fs').readFileSync('defaults/patronum.json','utf8'))" && echo "patronum.json OK"
```

### 5. Run self-test

Copy the updated defaults to the config and run verify:

```bash
cp defaults/patronum.json ~/.claude/patronum.json
CLAUDE_PLUGIN_ROOT="$(pwd)" node scripts/patronum-verify.js
```

### 6. Report

Confirm the pattern was added and tests pass.
