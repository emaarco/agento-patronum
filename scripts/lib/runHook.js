/**
 * agento-patronum — Shared hook wrapper
 * Handles config resolution, validation, stdin parsing, and exit logic.
 * Each hook script passes its enforce function here.
 */

'use strict';

const fs = require('fs');
const { resolveConfig, validateConfig, loadAllEntries, parseStdin, logViolation } = require('./patronum');

function collectActiveConfigs(config) {
  const configs = [];
  if (fs.existsSync(config.userConfig)) configs.push(config.userConfig);
  if (config.projConfig && fs.existsSync(config.projConfig)) configs.push(config.projConfig);
  if (config.localRepoConfig && fs.existsSync(config.localRepoConfig)) configs.push(config.localRepoConfig);
  return configs;
}

function runHook(enforceFn, opts) {
  const { failOpenOnBadConfig = false } = opts || {};

  if (!process.env.HOME) {
    process.stderr.write('PATRONUM: HOME is unset — blocking as safe default\n');
    process.exit(2);
  }

  const config = resolveConfig();
  const activeConfigs = collectActiveConfigs(config);

  if (activeConfigs.length === 0) process.exit(0);

  for (const cfg of activeConfigs) {
    if (!validateConfig(cfg)) {
      if (failOpenOnBadConfig) process.exit(0);
      process.stderr.write(`PATRONUM: config file '${cfg}' is invalid JSON — blocking as safe default\n`);
      process.exit(2);
    }
  }

  const entries = loadAllEntries(config);
  const home = process.env.HOME || '';
  const cwd = process.cwd();

  parseStdin().then((input) => {
    const result = enforceFn(input, entries, home, cwd);

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

module.exports = { runHook, collectActiveConfigs };
