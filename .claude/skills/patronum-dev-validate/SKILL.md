---
name: patronum-dev-validate
description: "Validate the agento-patronum plugin structure. Run before opening a PR."
disable-model-invocation: true
allowed-tools: Bash(node *), Bash(head *), Bash(test *), Glob, Read
---

# Skill: patronum-dev-validate

Run all plugin validation checks locally.

## Steps

### 1. JSON validity

```bash
node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json','utf8'))" && echo "plugin.json OK"
node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json','utf8'))" && echo "marketplace.json OK"
node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json','utf8'))" && echo "hooks.json OK"
node -e "JSON.parse(require('fs').readFileSync('defaults/patronum.json','utf8'))" && echo "patronum.json OK"
```

### 1b. marketplace.json schema

Verify the `source` field starts with `./` and `metadata.description` is present (both required by Claude Code validation):

```bash
node -e "
const m = JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json','utf8'));
const p = m.plugins[0];
if (typeof p.source === 'string' && p.source.startsWith('./')) console.log('marketplace source OK');
else { console.error('marketplace source FAIL'); process.exit(1); }
"
node -e "
const m = JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json','utf8'));
const d = m.metadata && m.metadata.description;
if (typeof d === 'string' && d.length > 0) console.log('marketplace description OK');
else { console.error('marketplace description FAIL'); process.exit(1); }
"
```

### 2. Default patterns check

Verify `defaults/patronum.json` has at least one entry:

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('defaults/patronum.json','utf8'));
const count = d.entries.length;
if (count > 0) console.log('Default patterns: ' + count + ' entries OK');
else { console.error('No default patterns found'); process.exit(1); }
"
```

### 3. Script syntax

```bash
node -e "
const fs = require('fs');
const glob = require('path');
['hooks', 'management', 'setup'].forEach(dir => {
  fs.readdirSync('scripts/' + dir).filter(f => f.startsWith('patronum-') && f.endsWith('.js')).forEach(f => {
    const p = 'scripts/' + dir + '/' + f;
    try { require('child_process').execSync('node -c ' + p, {stdio:'pipe'}); console.log(p + ' OK'); }
    catch(e) { console.error(p + ' FAIL'); process.exit(1); }
  });
});
"
```

### 4. Script permissions

```bash
for f in scripts/hooks/patronum-*.js scripts/management/patronum-*.js scripts/setup/patronum-*.js; do
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
