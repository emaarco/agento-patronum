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

| Scope | Command | Protects | Team-shared |
|-------|---------|----------|-------------|
| **user** *(default)* | `/plugin install agento-patronum@emaarco` | All your Claude Code sessions | No |
| **project** | `/plugin install agento-patronum@emaarco --scope project` | This repository only | Yes — via `.claude/settings.json` |
| **local** | `/plugin install agento-patronum@emaarco --scope local` | This repository only | No — gitignored |

**User scope** *(recommended default)*
- ✅ Install once — all projects on this machine are protected
- ✅ Global files (`~/.ssh/`, `~/.aws/`, `.env`) are covered across every project
- ❌ No per-project rule customisation out of the box
- ❌ Each team member installs separately

**Project scope**
- ✅ Plugin enforced automatically for all contributors via committed `.claude/settings.json`
- ✅ Per-project rules supported — add `~/.claude/patronum/projects/<repo-id>.json` on each machine
- ❌ Only protects this repository's sessions — other projects are unprotected unless user scope is also installed
- ❌ Per-project config lives on each machine individually, not committed to the repo

**Local scope**
- ✅ Per-project isolation without affecting teammates
- ❌ Not shared; each contributor installs and configures separately

::: tip Per-project rules
agento-patronum stores configs in `~/.claude/patronum/`. When `~/.claude/patronum/projects/<repo-id>.json` exists, it takes priority over `user.json` for sessions in that repository — giving you isolated rules per project without touching the repo itself.
:::

::: info Which scope should I use?
**Solo developer**: use **user scope** (the default). Install once, protected everywhere.

**Team setup**: install at **project scope** — this commits `.claude/settings.json` so contributors get the plugin automatically when opening Claude Code in the repo. Encourage contributors to also install at user scope to protect their other projects.
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
