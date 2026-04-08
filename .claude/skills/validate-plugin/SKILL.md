---
name: validate-plugin
description: "Validate the agento-patronum plugin structure. Run before opening a PR."
disable-model-invocation: true
allowed-tools: Bash(bash -n *), Bash(jq *), Bash(head *), Bash(test *), Glob, Read
---

# Skill: validate-plugin

Run all plugin validation checks locally.

## Steps

### 1. JSON validity

```bash
jq empty .claude-plugin/plugin.json && echo "plugin.json OK"
jq empty hooks/hooks.json && echo "hooks.json OK"
jq empty defaults/patronum.json && echo "patronum.json OK"
```

### 2. Default patterns check

Verify `defaults/patronum.json` has at least one entry:

```bash
COUNT=$(jq '.entries | length' defaults/patronum.json)
[ "$COUNT" -gt 0 ] && echo "Default patterns: $COUNT entries OK"
```

### 3. Bash syntax

```bash
for f in scripts/patronum-*.sh; do
  bash -n "$f" && echo "$f OK"
done
```

### 4. Script permissions

```bash
for f in scripts/patronum-*.sh; do
  test -x "$f" && echo "$f executable OK"
done
```

### 5. SKILL.md frontmatter

Check each SKILL.md has a `name:` and `description:` in its frontmatter:

```bash
for f in skills/*/SKILL.md; do
  head -10 "$f" | grep -q "^name:" && echo "$f: name OK"
  head -10 "$f" | grep -q "^description:" && echo "$f: description OK"
done
```

### 6. Report

Summarize all results. Use before opening a PR.
