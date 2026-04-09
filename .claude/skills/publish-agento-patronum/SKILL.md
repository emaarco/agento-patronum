---
name: publish-agento-patronum
argument-hint: "<new-version>"
description: "Release a new version of agento-patronum: bumps plugin.json version, updates changelog, creates a GitHub release draft."
disable-model-invocation: true
allowed-tools: Read, Edit, Bash(git *), Bash(gh release *), Bash(node *)
---

# Skill: publish-agento-patronum

Release a new version of agento-patronum.

> **Note:** agento-patronum is a Node.js plugin — not an npm package. The version lives in `.claude-plugin/plugin.json`. Do not use `npm version`.

> **Docs deploy:** The `deploy-docs.yml` workflow runs automatically when a GitHub release is published. No manual trigger needed.

## Pre-flight checks

### 1. Confirm clean working tree

```bash
git status --short
```

Stop if any uncommitted changes exist. Tell the user to commit or stash them first.

### 2. Confirm on main

```bash
git branch --show-current
```

Stop if not on `main`.

### 3. Confirm the new version

Show the current version and ask for the new one if not provided as an argument:

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json','utf8')).version)"
```

Follow semver: `MAJOR.MINOR.PATCH`.

## Version bump

### 4. Bump version in plugin.json

```bash
node -e "
const fs = require('fs');
const path = '.claude-plugin/plugin.json';
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
pkg.version = '<new-version>';
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
"
```

Verify:

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json','utf8')).version)"
```

## Changelog

### 5. Update docs/src/reference/changelog.md

Prepend a new section above the existing entries:

```markdown
## <new-version>

_Released YYYY-MM-DD_

- <change 1>
- <change 2>
```

Ask the user for the list of changes to include if not already provided.

## Commit and push

### 6. Stage and commit

```bash
git add .claude-plugin/plugin.json docs/src/reference/changelog.md
git commit -m "chore: release v<new-version>"
```

### 7. Push to main

```bash
git push origin main
```

## GitHub release

### 8. Create a draft release

Check previous releases for release notes format:

```bash
gh release list --limit 5
```

Then create the draft:

```bash
gh release create "v<new-version>" \
  --title "v<new-version>" \
  --notes "<release notes>" \
  --draft
```

Use `--draft` so the user can review before publishing.

### 9. Done

Report the draft release URL. Remind the user:
- Review and publish the draft release on GitHub.
- Publishing triggers `deploy-docs.yml` to redeploy the docs automatically.

## Release notes format

- Start with `🚀 Release – agento-patronum v<VERSION>`
- Include a **What's New** section with key changes
- End with a **Full Changelog** link:
  `https://github.com/emaarco/agento-patronum/compare/v<PREV>...v<VERSION>`

Use previous release notes as reference: `gh release view v<PREV>`
