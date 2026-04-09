# Installation

Get agento-patronum running in under a minute. Two commands, one restart — your credentials are shielded.

## Prerequisites

agento-patronum requires **jq** for JSON processing. Check if you have it:

```bash
jq --version
```

If not, install it:

::: code-group

```bash [macOS]
brew install jq
```

```bash [Debian / Ubuntu]
apt install jq
```

```bash [RHEL / CentOS]
yum install jq
```

```bash [WSL / Windows]
apt install jq
```

:::

## Install in two commands

Run these inside Claude Code:

```bash
# Step 1 — add marketplace (once per machine)
/plugin marketplace add emaarco/agento-patronum

# Step 2 — install plugin
/plugin install agento-patronum@emaarco
```

That's it. Hook active. Credentials shielded.

::: tip Restart required
Claude Code doesn't have a `PostInstall` lifecycle event yet — that would be the natural solution here, and may be added in a future version. For now, agento-patronum uses a `SessionStart` hook that runs setup on the first session start after installation. **Restart Claude Code once** after installing to activate protection.
:::

## Installation scopes

Claude Code plugins can be installed at three scopes — all three can be active at once, their configs are [merged](#config-merging).

| Scope | Protected | Fires in | Committed | Config |
|-------|-----------|----------|-----------|--------|
| **user** | You | Every repo on this machine | No | `~/.claude/patronum/patronum.json` |
| **project** | Everyone on the team | This repo only | Yes — shared with contributors | `.claude/patronum/patronum.json` |
| **local** | You | This repo only | No — gitignored | `.claude/patronum/patronum.local.json` |

::: info Which scope should I use?
**Solo developer** — use **user scope** (the default). Install once, protected everywhere, nothing to commit.

**Team setup** — install at **project scope**. `.claude/settings.json` is committed so every contributor gets the plugin automatically, and the shared `.claude/patronum/patronum.json` ensures everyone enforces the same rules. Encourage contributors to also install at user scope so personal credential protections (SSH keys, AWS credentials) stay active across all their projects.
:::

::: tip Repo configs are auto-created
On the first `SessionStart` after install, `patronum-setup.sh` creates the right config file if it doesn't exist yet. Add these to your `.gitignore`:
```
.claude/patronum/patronum.local.json
.claude/patronum/patronum.log
```
:::

### Config merging

All present configs are loaded simultaneously — rules are merged, not replaced:

| Config file | Scope | Always loaded? |
|-------------|-------|---------------|
| `~/.claude/patronum/patronum.json` | user | ✅ Yes |
| `.claude/patronum/patronum.json` | project | When committed to the repo |
| `.claude/patronum/patronum.local.json` | local | When present (gitignored) |

Your personal credential protections (`~/.ssh/`, `~/.aws/`) can never be overridden by a project config. `/patronum-list` shows each config separately.

::: info Which scope should I use?
**Solo developer**: use **user scope** (the default). Install once, protected everywhere.

**Team setup**: install at **project scope** — `.claude/settings.json` is committed so every contributor gets the plugin automatically. The shared `.claude/patronum/patronum.json` ensures everyone enforces the same rules. Encourage contributors to also install at user scope so their personal credential protections (SSH keys, AWS credentials) remain active in every project they work on.
:::

## Verify installation

After restarting Claude Code, run:

```
/patronum-verify
```

This runs a self-test that confirms the hook is blocking protected files and allowing safe ones.

## Uninstall

```bash
/plugin uninstall agento-patronum@emaarco
```

Your `~/.claude/patronum/` config directory is preserved — your custom patterns won't be lost if you reinstall later.

To fully remove all agento-patronum data (config and audit log):

```bash
bash ~/.claude/plugins/agento-patronum/scripts/patronum-uninstall.sh
```
