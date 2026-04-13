# Managing agento-patronum

Day-to-day plugin lifecycle: verify, update, suspend, and uninstall.

## Verify installation

After installing and restarting Claude Code, confirm the hook is active:

```
/patronum-verify
```

This runs a self-test that blocks a protected file and allows a safe one — green output means the hook is working.

**Quick visual check**: open `/plugin` → **Installed** tab and confirm agento-patronum appears in the list.

## Update the plugin

To pull the latest version, run inside Claude Code:

```bash
claude plugin update agento-patronum@emaarco
```

Or via the UI: open `/plugin` → **Installed** tab → find agento-patronum → click **Update**.

Restart Claude Code after updating so the new hook version takes effect.

## Suspend without uninstalling

To temporarily pause agento-patronum without losing your config:

```bash
# Suspend
claude plugin disable agento-patronum@emaarco

# Resume
claude plugin enable agento-patronum@emaarco
```

After re-enabling, run `/reload-plugins` to activate the hook without a full restart.

::: warning Hooks may still fire when disabled
`claude plugin disable` removes the plugin from Claude Code's active list, but the hook scripts remain on disk. Depending on how Claude Code handles this, the hook may continue to block tools even while the plugin is marked disabled. **Restart Claude Code** after disabling to guarantee enforcement stops.
:::

## Uninstall

### Remove from one scope only

If you installed at multiple scopes and want to remove from just one:

```bash
# Remove from project scope only
claude plugin uninstall agento-patronum@emaarco --scope project

# Remove from local scope only
claude plugin uninstall agento-patronum@emaarco --scope local
```

### Full plugin removal

To remove from all scopes:

```bash
/plugin uninstall agento-patronum@emaarco
```

Your config files (`~/.claude/patronum/`, `.claude/patronum/`) are preserved — custom patterns won't be lost if you reinstall later.

### Full data removal

To remove all agento-patronum data (config files and audit logs), run these two steps:

**Step 1 — Uninstall the plugin:**
```bash
claude plugin uninstall agento-patronum@emaarco
```

**Step 2 — Remove config and log files:**

Locate and run the cleanup script (Claude Code stores plugins in a versioned cache path):

```bash
# Locate the script
PATRONUM_UNINSTALL=$(find ~/.claude/plugins/cache -name "patronum-uninstall.js" 2>/dev/null | head -1)

# Run it (from inside your git repo if you have a project/local install)
node "$PATRONUM_UNINSTALL"
```

This removes `~/.claude/patronum/` (user-scope data). If you installed at project or local scope, run the command from inside your git repository — the script will also remove `.claude/patronum/` from the repo root.

::: tip No local cache?
If step 1 already cleared the cache, clone the repo and run from source:
```bash
git clone https://github.com/emaarco/agento-patronum.git
node agento-patronum/scripts/setup/patronum-uninstall.js
```
:::
