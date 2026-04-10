# agento-patronum

> *Expecto Patronum!* — Summon your guardian for Claude Code sessions.
> Protect sensitive files, credentials, and commands from unintended AI access.

**[Documentation](https://emaarco.github.io/agento-patronum/)** | **[Marketplace](https://github.com/emaarco/agento-patronum)**

> [!NOTE]
> agento-patronum is in early development (v0.1.0). Features, skill names, and default patterns may change between releases. Feedback and contributions are very welcome.

---

## 🛡️ What it protects you from

Claude Code is powerful. That power needs boundaries.
When Claude can read your `.env`, your SSH keys, your AWS credentials — it will.
Not maliciously. Just helpfully. agento-patronum draws the line.

It uses **PreToolUse hooks** — an explicit enforcement layer you control and can verify.
Built-in `settings.json` deny rules may or may not be reliable; [past reports suggest gaps](https://emaarco.github.io/agento-patronum/internals/why-hooks). Hooks are a transparent alternative.

## ⚡ Install in two commands

```bash
# Add marketplace (once per machine)
/plugin marketplace add emaarco/agento-patronum

# Install plugin (user scope — protects all projects)
/plugin install agento-patronum@emaarco
```

Restart Claude Code once. Done. Run `/patronum-verify` to confirm.

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
| Shell commands | `printenv` |

Need more? Run `/patronum-suggest` — it analyzes your stack and recommends what to add.

## ⚙️ How it works

agento-patronum registers a `PreToolUse` hook that intercepts every `Read`, `Write`, `Edit`, and `Bash` tool call. It checks the file path or command against patterns in `~/.claude/patronum/patronum.json`. If a pattern matches, the tool call is blocked and logged.

No cloud, no binary, no external dependencies. Pure Node.js — guaranteed by Claude Code.

## 📖 Story behind the plugin

Claude Code offers built-in `permissions.deny` rules in `settings.json`. These may work correctly — but you can't see how they're interpreted internally. Community reports have raised questions about edge cases ([#6699](https://github.com/anthropics/claude-code/issues/6699), [#6631](https://github.com/anthropics/claude-code/issues/6631), [#24846](https://github.com/anthropics/claude-code/issues/24846)), and [The Register covered the topic](https://www.theregister.com/2026/01/28/claude_code_ai_secrets_files/) in early 2026.

agento-patronum takes a different approach: PreToolUse hooks are code you own. Every interception is explicit, every blocked call is logged, and you can read the source to verify exactly what happens. No build, no daemon, no account, no data leaving your machine.

Read more in [Why patronum](https://emaarco.github.io/agento-patronum/internals/why-patronum) and [Why Hooks](https://emaarco.github.io/agento-patronum/internals/why-hooks).

## 🤝 Contributing

agento-patronum welcomes all kinds of contributions — code, new default protection patterns, documentation improvements, bug reports, ideas, and feedback.

- **Report a bug**: [Open a bug report](https://github.com/emaarco/agento-patronum/issues/new?template=bug.yml)
- **Request a feature or pattern**: [Open a feature request](https://github.com/emaarco/agento-patronum/issues/new?template=feature.yml)
- **Propose a refactor**: [Open a refactor issue](https://github.com/emaarco/agento-patronum/issues/new?template=refactor.yml)
- **Improve the docs**: Every documentation page has an edit link
- **Add a default pattern**: Fork the repo, edit `defaults/patronum.json`, and open a PR
- **Write or improve a skill**: Skills live in `skills/*/SKILL.md` — plain Markdown, easy to edit

---

*Created with ♥ by [Marco Schaeck](https://www.linkedin.com/in/schaeckm) · [LinkedIn](https://www.linkedin.com/in/schaeckm) · [Medium](https://medium.com/@emaarco)*
