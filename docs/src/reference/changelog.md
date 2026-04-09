# Changelog

All notable changes to agento-patronum are documented here.

## [0.0.0.1] - 2026-04-09

### Changed

- Landing page hero title updated from "Your files. Protected." to "Your secrets. Protected." for sharper, more specific messaging
- Added awareness copy in the "invisible risk" section: calls out that most developers using AI agents today haven't secured themselves from credential exposure

## 0.1.0

Initial release.

- PreToolUse hook enforcement for Read, Write, Edit, MultiEdit, and Bash tools
- 14 default protection patterns (env files, SSH keys, cloud credentials, package tokens, shell commands)
- Slash commands: `/patronum-add`, `/patronum-remove`, `/patronum-list`, `/patronum-suggest`, `/patronum-verify`
- Proactive `/patronum-suggest` skill (auto-invokable)
- JSONL audit log at `~/.claude/patronum.log`
- Pure bash + jq implementation — no python, no binaries
- VitePress documentation
