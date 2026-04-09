#!/usr/bin/env node
/**
 * agento-patronum — UserPromptSubmit enforcement hook
 * Blocks @mention references to protected files before Claude sees their content.
 * Manage with: /patronum-add /patronum-remove /patronum-list
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { matchGlob } = require('./lib/matching');
const { resolveConfig, validateConfig, loadAllEntries } = require('./lib/config');
const { parseStdin } = require('./lib/io');
const { logViolation } = require('./lib/logging');

// ── Enforce logic ───────────────────────────────────────────────────────

function enforcePrompt(input, entries, home, cwd) {
  const prompt = input.prompt || '';
  if (!prompt) return { blocked: false };

  const mentions = prompt.match(/@[^\s"'`]+/g) || [];
  if (mentions.length === 0) return { blocked: false };

  for (const mention of mentions) {
    const raw = mention.slice(1);

    let absPath;
    if (raw.startsWith('/')) {
      absPath = raw;
    } else if (raw.startsWith('~')) {
      absPath = raw.replace(/^~/, home);
    } else {
      absPath = path.join(cwd, raw);
    }

    for (const entry of entries) {
      if (!entry.pattern || entry.pattern.startsWith('Bash(')) continue;
      if (matchGlob(absPath, entry.pattern, home)) {
        return {
          blocked: true,
          tool: 'UserPromptSubmit',
          target: mention,
          pattern: entry.pattern,
          reason: entry.reason || '',
        };
      }
    }
  }
  return { blocked: false };
}

// ── Hook entry point ────────────────────────────────────────────────────

if (require.main === module) {
  if (!process.env.HOME) {
    process.stderr.write('PATRONUM: HOME is unset — blocking as safe default\n');
    process.exit(2);
  }

  const config = resolveConfig();
  const activeConfigs = [config.userConfig, config.projConfig, config.localRepoConfig]
    .filter(c => c && fs.existsSync(c));

  if (activeConfigs.length === 0) process.exit(0);

  for (const cfg of activeConfigs) {
    if (!validateConfig(cfg)) {
      // Fail-open: prompt hook should not block the user on bad config
      process.exit(0);
    }
  }

  const entries = loadAllEntries(config);

  parseStdin().then((input) => {
    const result = enforcePrompt(input, entries, process.env.HOME, process.cwd());

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

module.exports = { enforcePrompt };
