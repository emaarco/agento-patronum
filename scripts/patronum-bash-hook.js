#!/usr/bin/env node
/**
 * agento-patronum — PreToolUse Bash enforcement hook
 * Blocks Bash commands matching protected Bash(command) patterns.
 * Manage with: /patronum-add /patronum-remove /patronum-list
 */

'use strict';

const fs = require('fs');
const { matchGlob } = require('./lib/matching');
const { resolveConfig, validateConfig, loadAllEntries } = require('./lib/config');
const { parseStdin } = require('./lib/io');
const { logViolation } = require('./lib/logging');

// ── Enforce logic ───────────────────────────────────────────────────────

function enforceBash(input, entries) {
  const command = (input.tool_input && input.tool_input.command) || '';
  if (!command) return { blocked: false };

  for (const entry of entries) {
    if (!entry.pattern) continue;
    if (!entry.pattern.startsWith('Bash(') || !entry.pattern.endsWith(')')) continue;

    const blockedCmd = entry.pattern.slice(5, -1);
    const exactOnly = entry.match === 'exact';
    const follows = command.slice(blockedCmd.length);
    const endsAtBoundary = follows === '' || /^[\s|;&><]/.test(follows);
    if (command.startsWith(blockedCmd) && endsAtBoundary && (exactOnly ? follows === '' : true)) {
      return {
        blocked: true,
        tool: 'Bash',
        target: `Bash(${command})`,
        pattern: entry.pattern,
        reason: entry.reason || '',
      };
    }
  }
  return { blocked: false };
}

// Strip quoted strings from a shell command to avoid false positives on
// file-like tokens inside string arguments (e.g. --body "see .env for info").
function stripQuoted(cmd) {
  return cmd.replace(/"[^"]*"|'[^']*'/g, '""');
}

const FILE_TOKEN_RE = /(?:\/|~\/|\.\/)[^\s;|&><"'`$()]+|(?:^|\s)(\.env[^\s;|&><"'`$()]*)/g;

// Cross-reference defense: the Bash tool receives the full command string, so
// "cat .env" or "cat ~/.ssh/id_rsa" would bypass file-only pattern matching.
// Extracts file-path-like tokens and checks them against file glob patterns.
// See: https://cwe.mitre.org/data/definitions/78.html (OS Command Injection)
function enforceBashFiles(input, entries, home) {
  const command = (input.tool_input && input.tool_input.command) || '';
  if (!command) return { blocked: false };

  const fileEntries = entries.filter(e => e.pattern && !e.pattern.startsWith('Bash('));
  if (fileEntries.length === 0) return { blocked: false };

  const stripped = stripQuoted(command);
  const tokens = [];
  let m;
  FILE_TOKEN_RE.lastIndex = 0;
  while ((m = FILE_TOKEN_RE.exec(stripped)) !== null) {
    tokens.push((m[1] || m[0]).trim());
  }

  for (const token of tokens) {
    for (const entry of fileEntries) {
      if (matchGlob(token, entry.pattern, home)) {
        return {
          blocked: true,
          tool: 'Bash',
          target: `Bash(${command})`,
          pattern: entry.pattern,
          reason: entry.reason || 'File path in command matches protected pattern',
        };
      }
    }
  }
  return { blocked: false };
}

// ── Hook entry point ────────────────────────────────────────────────────

if (require.main === module) {
  if (!process.env.HOME) {
    process.stderr.write('PATRONUM: Cannot locate config directory — blocking all operations.\n');
    process.exit(2);
  }

  const config = resolveConfig();
  const activeConfigs = [config.userConfig, config.projConfig, config.localRepoConfig]
    .filter(c => c && fs.existsSync(c));

  if (activeConfigs.length === 0) process.exit(0);

  for (const cfg of activeConfigs) {
    if (!validateConfig(cfg)) {
      process.stderr.write(`PATRONUM: Config '${cfg}' contains invalid JSON — blocking all operations until fixed.\n`);
      process.exit(2);
    }
  }

  const entries = loadAllEntries(config);

  parseStdin().then((input) => {
    const cmdResult = enforceBash(input, entries);
    const result = cmdResult.blocked ? cmdResult : enforceBashFiles(input, entries, process.env.HOME);

    if (result.blocked) {
      logViolation(config.logFile, { tool: result.tool, target: result.target, pattern: result.pattern });
      process.stderr.write(`PATRONUM_VIOLATION: Access to '${result.target}' blocked. Pattern: ${result.pattern}\n`);
      if (result.reason) process.stderr.write(`Reason: ${result.reason}\n`);
      process.stderr.write('Manage with: /patronum-add or /patronum-remove in Claude Code\n');
      process.exit(2);
    }

    process.exit(0);
  });
}

module.exports = { enforceBash, enforceBashFiles };
