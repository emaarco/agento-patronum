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

| Scope | Command | Protects | Config location | Committed? |
|-------|---------|----------|-----------------|------------|
| **user** *(default)* | `/plugin install agento-patronum@emaarco` | All your sessions | `~/.claude/patronum/patronum.json` | No |
| **project** | `/plugin install agento-patronum@emaarco --scope project` | This repository only | `.claude/patronum/patronum.json` | ✅ Yes |
| **local** | `/plugin install agento-patronum@emaarco --scope local` | This repository only | `~/.claude/patronum/patronum.json` | No |

**User scope** *(recommended default)*
- ✅ Install once — all projects on this machine are protected
- ✅ Global files (`~/.ssh/`, `~/.aws/`, `.env`) covered across every project
- ❌ No per-project rule customisation
- ❌ Each team member installs separately

**Project scope**
- ✅ Plugin enforced for all contributors automatically via committed `.claude/settings.json`
- ✅ Protection rules live in `.claude/patronum/patronum.json` — version-controlled alongside your code
- ✅ On first SessionStart, agento-patronum creates `.claude/patronum/patronum.json` automatically if missing
- ✅ Both configs active simultaneously — user rules always apply, project rules add on top (see below)
- ❌ Only protects this repository's sessions — contributors should also install at user scope for their other projects

**Local scope**
- ✅ Per-project isolation without affecting teammates
- ❌ Not shared; each contributor installs and configures separately

::: tip Project-scope config is auto-created
When agento-patronum is installed at project scope, `patronum-setup.sh` detects this on the first `SessionStart` and creates `.claude/patronum/patronum.json` with the default protections. Commit it to share your team's protection rules.

Add the audit log to your `.gitignore`:
```
.claude/patronum/patronum.log
```
:::

### Config merging

When a project-scope config exists alongside the user config, **both are active at the same time**. Rules are merged, not replaced:

| Config | Always loaded? | Purpose |
|--------|---------------|---------|
| `~/.claude/patronum/patronum.json` | ✅ Yes | Personal rules — `~/.ssh/`, `~/.aws/`, global patterns |
| `.claude/patronum/patronum.json` | When present in git root | Team rules — project-specific files and commands |

This means your personal credential protections can never be silently overridden by a project config. A contributor working in a project-scope repo gets both their own user rules and the team's project rules enforced simultaneously.

`/patronum-list` shows each config separately so you can see exactly which rules are active.

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
