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
Claude Code has no `PostInstall` lifecycle event. Instead, agento-patronum registers a `SessionStart` hook that runs setup on the first session start after installation. **Restart Claude Code once** after installing to activate protection.
:::

::: warning Install at user scope
agento-patronum **must be installed at user scope** (the default). A project-scoped install only protects that one repository — your `~/.ssh/*`, `~/.aws/credentials`, and `.env` files in other projects would be unprotected.

```bash
# ✅ Correct — protects all projects (default)
/plugin install agento-patronum@emaarco

# ⚠️ Wrong for a security plugin — only protects one project
/plugin install agento-patronum@emaarco --scope project
```
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

Your `~/.claude/patronum.json` config is preserved — your custom patterns won't be lost if you reinstall later.

To fully remove all agento-patronum data (config and audit log):

```bash
bash ~/.claude/plugins/agento-patronum/scripts/patronum-uninstall.sh
```
