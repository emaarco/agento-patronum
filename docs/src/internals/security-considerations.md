# Security Considerations

patronum relies on Claude Code's hook system to intercept tool calls. That system has known gaps — this page documents them so you can make informed decisions about your setup.

## Subagent scope limitation

Claude Code's `Agent` tool spawns subagents as independent processes. These subagents only inherit settings from `~/.claude/settings.json` (user scope) — they do **not** see project-level (`.claude/settings.json`) or local-level (`.claude/settings.local.json`) plugin registrations.

**What this means:** if patronum is installed only at project or local scope, the primary Claude Code agent is fully protected, but any subagent it launches can read protected files, run blocked commands, and access credentials without patronum hooks ever firing.

::: danger Install at user scope
To protect subagents, install patronum at **user scope**. This is the single most important step you can take.

```bash
# Inside Claude Code — installs at user scope (the default)
/plugin marketplace add emaarco/agento-patronum
/plugin install agento-patronum@emaarco
```

Run `/patronum-verify` to confirm your scope coverage.
:::

### Why user scope fixes this

When patronum is installed at user scope, its hooks are registered in `~/.claude/settings.json` — the one settings file subagents inherit. The hooks fire for every tool call, including those made by subagents.

**Project and local blacklists and whitelists still work.** patronum's config resolution loads all three config levels by file path (user, project, local) regardless of which settings file activated the plugin. So a user-scope install gives you:

- Hooks fire everywhere — primary agent and subagents
- User-scope rules (`~/.claude/patronum/patronum.json`) — always active
- Project-scope rules (`.claude/patronum/patronum.json`) — active when present in the repo
- Local-scope rules (`.claude/patronum/patronum.local.json`) — active when present in the repo

### Recommended setup

| Who | Install at | Why |
|-----|-----------|-----|
| **Everyone** | User scope | Hooks fire in subagents. Personal credentials (SSH, AWS, etc.) protected across all repos. |
| **Teams** | User scope + project scope | Team-shared rules committed to the repo. Every contributor gets the same baseline. |
| **Per-repo overrides** | User scope + local scope | Personal patterns for a specific repo, gitignored. |

User scope is the foundation. Project and local scope add rules on top.

### What happens without user scope

If patronum is only installed at project or local scope:

- The primary Claude Code agent is fully protected
- Subagents launched via the `Agent` tool bypass all patronum hooks
- A subagent can read `.env`, SSH keys, AWS credentials — anything patronum would normally block
- No violations are logged because the hooks never fire

## Upstream tracking

This is a known Claude Code platform limitation, not a patronum bug. The relevant upstream issues:

- [anthropics/claude-code#21460](https://github.com/anthropics/claude-code/issues/21460) — `PreToolUse` hooks not enforced on subagent tool calls
- [anthropics/claude-code#18950](https://github.com/anthropics/claude-code/issues/18950) — Subagents do not inherit user-level permissions (labeled `bug`, `area:security`)

The [Claude Code hooks reference](https://docs.anthropic.com/en/docs/claude-code/hooks) mentions `agent_id` in hook input "when the hook fires inside a subagent call," implying inheritance — but empirically, hooks only fire when the plugin is registered at user scope. The [sub-agents reference](https://docs.anthropic.com/en/docs/claude-code/sub-agents) confirms: *"For session-wide hooks, configure them in `settings.json`"* (the global one).

Once Claude Code resolves these issues, project and local scope installs may gain subagent coverage automatically. Until then, user scope is the reliable path.
