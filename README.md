# agento-patronum

> *Expecto Patronum!* — Summon your guardian for Claude Code sessions.
> Protect sensitive files, credentials, and commands from unintended AI access.

**[Documentation](https://emaarco.github.io/agento-patronum/)** | **[Marketplace](https://github.com/emaarco/agento-patronum)**

---

## 🛡️ What it protects you from

Claude Code is powerful. That power needs boundaries.
When Claude can read your `.env`, your SSH keys, your AWS credentials — it will.
Not maliciously. Just helpfully. agento-patronum draws the line.

It enforces file protection via **PreToolUse hooks** — the only layer Claude Code can't silently bypass.
Settings.json deny rules are [confirmed buggy](https://emaarco.github.io/agento-patronum/internals/why-hooks). Hooks are reliable.

## ⚡ Install in two commands

```bash
# Add marketplace (once per machine)
/plugin marketplace add emaarco/agento-patronum

# Install plugin (user scope — protects all projects)
/plugin install agento-patronum@emaarco
```

Restart Claude Code once. Done. Run `/patronum-verify` to confirm.

## 📋 Prerequisites

agento-patronum requires **jq** for JSON processing. Install it:

```bash
# macOS
brew install jq

# Linux (Debian/Ubuntu)
apt install jq

# Linux (RHEL/CentOS)
yum install jq

# WSL / Windows
apt install jq
```

The setup script will fail with a clear error if jq is missing. No other dependencies.

## 🧰 Available skills

agento-patronum is built with [skills](https://agentskills.io) — the open specification for agent capabilities. Invoke them as slash commands in Claude Code:

| Skill | Description |
|-------|-------------|
| `/patronum-add` | Add a pattern to the protection list |
| `/patronum-remove` | Remove a pattern |
| `/patronum-list` | Show all protected patterns |
| `/patronum-suggest` | Get stack-specific protection suggestions |
| `/patronum-verify` | Run self-test to verify enforcement |

## 🔒 What's protected by default

Out of the box, agento-patronum blocks access to:

| Category | Patterns |
|----------|----------|
| Environment files | `**/.env`, `**/.env.*` |
| Private keys | `**/*.pem`, `**/*.key` |
| SSH | `~/.ssh/*` |
| AWS | `~/.aws/credentials`, `~/.aws/config` |
| Docker | `~/.docker/config.json` |
| Kubernetes | `~/.kube/config` |
| Package tokens | `~/.npmrc`, `~/.pypirc` |
| Shell commands | `printenv`, `env`, `set` |

Need more? Run `/patronum-suggest` — it analyzes your stack and recommends what to add.

## ⚙️ How it works

agento-patronum registers a `PreToolUse` hook that intercepts every `Read`, `Write`, `Edit`, and `Bash` tool call. It checks the file path or command against patterns in `~/.claude/patronum.json`. If a pattern matches, the tool call is blocked and logged.

No cloud, no binary, no Python. Pure bash + jq.

## 📖 Story behind the plugin

Claude Code's `permissions.deny` rules in `settings.json` should prevent access to sensitive files.
They don't — deny rules are frequently ignored due to confirmed bugs.

agento-patronum was built because the only reliable way to protect files is through PreToolUse hooks.
The plugin makes this protection accessible via two install commands and manageable via slash commands.

Read more in the [documentation](https://emaarco.github.io/agento-patronum/internals/why-hooks).

## 🤝 Contributing

Contributions welcome! You can:

- **Suggest default patterns**: Know a file that should be protected? [Open a pattern suggestion](https://github.com/emaarco/agento-patronum/issues/new?template=pattern_suggestion.yml)
- **Report bugs**: [Open a bug report](https://github.com/emaarco/agento-patronum/issues/new?template=bug_report.yml)
- **Improve docs**: Edit links on every documentation page

---

*Created with ♥ by [Marco Schaeck](https://www.linkedin.com/in/schaeckm) · [LinkedIn](https://www.linkedin.com/in/schaeckm) · [Medium](https://medium.com/@emaarco)*
