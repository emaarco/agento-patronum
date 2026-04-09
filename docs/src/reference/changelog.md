# Changelog

All notable changes to agento-patronum are documented here.

## 0.1.0

Initial release.

- PreToolUse hook enforcement for Read, Write, Edit, MultiEdit, and Bash tools
- 12 default protection patterns (env files, SSH keys, cloud credentials, package tokens, shell commands)
- Slash commands: `/patronum-add`, `/patronum-remove`, `/patronum-list`, `/patronum-suggest`, `/patronum-verify`
- Proactive `/patronum-suggest` skill (auto-invokable)
- JSONL audit log at `~/.claude/patronum/patronum.log`
- Pure Node.js implementation — no external dependencies
- VitePress documentation
