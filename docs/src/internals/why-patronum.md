# Why patronum

AI coding agents read everything in your project by default — `.env` files, SSH keys, AWS credentials, API tokens. Not maliciously, just helpfully. If you haven't explicitly restricted what your agent can access, your credentials are in scope.

agento-patronum exists to give you explicit, observable control over what's off-limits.

## The numbers

The risk isn't theoretical. Research data shows AI-assisted development amplifies secret exposure:

- **3.2% of AI-assisted commits contain leaked secrets** — double the 1.6% human baseline ([GitGuardian State of Secrets Sprawl 2026](https://blog.gitguardian.com/the-state-of-secrets-sprawl-2026-pr/))
- **6.4% in GitHub Copilot-active repos** — four times the human rate ([GitGuardian](https://blog.gitguardian.com/the-state-of-secrets-sprawl-2026-pr/))
- **AI-service credential leaks surged 81% year-over-year**, with 1.27 million detected in 2025 alone ([TechRadar](https://www.techradar.com/pro/security/over-29-million-secrets-were-leaked-on-github-in-2025-and-ai-really-isnt-helping))
- **24,008 unique secrets found in MCP config files** on public GitHub — 2,117 still valid at time of discovery ([GitGuardian](https://blog.gitguardian.com/claude-code-security-why-the-real-risk-lies-beyond-code/))
- **Malicious repos can execute with the user's shell permissions**, putting credentials in dotfiles directly in scope ([PromptArmor](https://www.promptarmor.com/resources/hijacking-claude-code-via-injected-marketplace-plugins))

The trend is clear: as AI writes more code, more secrets end up where they shouldn't.

## Why explicit control matters

Most tools — including Claude Code — offer built-in access controls like `permissions.deny` in `settings.json`. These may well work correctly. But there's a fundamental difference between a rule you configure and hope is interpreted the way you expect, and code you own and can observe executing.

With `settings.json` deny rules, you write a pattern and trust the runtime to enforce it. You can't see how it's interpreted. You can't verify it ran. If something slips through, there's no log to tell you what happened. [Community reports](https://github.com/anthropics/claude-code/issues/6699) have raised questions about edge cases — but even without those reports, the core argument stands:

**Hooks give you code you control.** Every interception is explicit. Every blocked call is logged. You can read the source, verify the behavior, and know exactly what happened. That's a different kind of confidence than trusting a black-box rule engine.

## What makes patronum different

agento-patronum is deliberately minimal. That simplicity is the point.

- **No build step** — pure Node.js skills and shell scripts. Nothing to compile, no toolchain to install.
- **No daemon** — runs only when Claude Code runs. Nothing in your background processes.
- **No account** — no signup, no API key, no telemetry, no data collection.
- **No data leaves your machine** — everything is local pattern matching against a JSON file.
- **Two commands to install** — marketplace add + plugin install. Done.

It should work the same way in a personal side project and in a 500-engineer monorepo — without any extra setup or configuration overhead. Config is a single JSON file. Code you can audit in a few minutes.

## How it compares

| Tool | Approach | Build required? | Pre-read blocking? |
|------|----------|-----------------|---------------------|
| **agento-patronum** | PreToolUse hooks, JSON config, marketplace plugin | No — pure Node.js | Yes |
| [kornysietsma/claude-code-permissions-hook](https://github.com/kornysietsma/claude-code-permissions-hook) | PreToolUse hooks, regex rules, audit log | Yes — Rust build step | Yes |
| [sgasser/claude-code-security-hook](https://gist.github.com/sgasser/efeb186bad7e68c146d6692ec05c1a57) | Single-file hook, credential patterns | No | Yes |
| GitGuardian / TruffleHog / gitleaks | Scan commits and CI pipelines for secrets | Varies | No — post-write only |
| [Lasso claude-hooks](https://github.com/anthropics/claude-code/discussions/8944) | Prompt injection defense | Varies | Different threat model |
| [claude-code-safety-net](https://github.com/anthropics/claude-code/discussions/8944) | Blocks destructive commands | No | Different threat model |

The key differentiator isn't just marketplace availability — it's that patronum requires nothing beyond what Claude Code already guarantees (Node.js), while giving you the same explicit enforcement as tools that need a build step.

## Further reading

- [Why Hooks (not settings.json)](/internals/why-hooks) — deep dive on the hook mechanism and community-reported issues with deny rules
- [How It Works](/internals/how-it-works) — technical walkthrough of the hook flow and pattern matching
- [Installation](/getting-started/installation) — get started in two commands
