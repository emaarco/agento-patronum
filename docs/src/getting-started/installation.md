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

| Scope | Who gets it | Where it fires | Config file |
|-------|------------|----------------|-------------|
| **user** | You | Every repo on this machine | `~/.claude/patronum/patronum.json` |
| **project** | Everyone (via committed `.claude/settings.json`) | This repo only | `.claude/patronum/patronum.json` ✅ committed |
| **local** | You (via gitignored `.claude/settings.local.json`) | This repo only | `.claude/patronum/patronum.local.json` |

**User scope** — the hook is in `~/.claude/settings.json` and fires in every repo you open. Install once, protected everywhere.
- ✅ No per-project setup required
- ❌ Each team member installs separately

**Project scope** — the hook is committed to `.claude/settings.json`. Every contributor who clones the repo gets the plugin automatically. The team's protection rules live in `.claude/patronum/patronum.json`, also committed.
- ✅ New contributors are protected from day one
- ✅ Shared ruleset, version-controlled
- ✅ Personal user config is still merged on top — see [Config merging](#config-merging)
- ❌ Contributors should also install at user scope for their other projects

**Local scope** — the hook is in `.claude/settings.local.json` (gitignored). Fires only in this repo, personal only, nothing committed. Rules go in `.claude/patronum/patronum.local.json` (also gitignored), keeping them separate from any committed team config.
- ✅ Repo-scoped without affecting teammates or committed files
- ✅ No conflict with a project-scope config in the same repo
- ❌ Other repos are unprotected

::: tip Repo configs are auto-created
On the first `SessionStart` after install, `patronum-setup.sh` detects the scope and creates the right config file if it doesn't exist yet:
- Project scope → `.claude/patronum/patronum.json` (commit this to share rules with your team)
- Local scope → `.claude/patronum/patronum.local.json` (gitignored, personal only)

Add these to your `.gitignore`:
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
