#!/usr/bin/env node
/**
 * agento-patronum — PreToolUse Bash enforcement hook
 * Blocks Bash commands matching protected Bash(command) patterns.
 * Manage with: /patronum-add /patronum-remove /patronum-list
 */

'use strict';

const fs = require('fs');
const { resolveConfig, validateConfig, loadAllEntries } = require('./lib/config');
const { parseStdin } = require('./lib/io');
const { logViolation } = require('./lib/logging');
const { enforceBash } = require('./lib/enforce-bash');

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
    process.stderr.write(`PATRONUM: config file '${cfg}' is invalid JSON — blocking as safe default\n`);
    process.exit(2);
  }
}

const entries = loadAllEntries(config);

parseStdin().then((input) => {
  const result = enforceBash(input, entries);

  if (result.blocked) {
    logViolation(config.logFile, { tool: result.tool, target: result.target, pattern: result.pattern });
    process.stderr.write(`PATRONUM_VIOLATION: Access to '${result.target}' blocked. Pattern: ${result.pattern}\n`);
    if (result.reason) process.stderr.write(`Reason: ${result.reason}\n`);
    process.stderr.write('Manage with: /patronum-add or /patronum-remove in Claude Code\n');
    process.exit(2);
  }

  process.exit(0);
});
