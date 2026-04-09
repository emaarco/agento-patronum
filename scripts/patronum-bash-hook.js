#!/usr/bin/env node
/**
 * agento-patronum — PreToolUse Bash enforcement hook
 * Blocks Bash commands matching protected Bash(command) patterns.
 * Manage with: /patronum-add /patronum-remove /patronum-list
 */

'use strict';

const fs = require('fs');
const { resolveConfig, loadAllEntries, validateConfig, parseStdin, logViolation } = require('./lib/patronum');

// Fail closed if HOME is unset
if (!process.env.HOME) {
  process.stderr.write('PATRONUM: HOME is unset — blocking all tool calls as safe default\n');
  process.exit(2);
}

const config = resolveConfig();

// Collect active config paths
const activeConfigs = [];
if (fs.existsSync(config.userConfig)) activeConfigs.push(config.userConfig);
if (config.projConfig && fs.existsSync(config.projConfig)) activeConfigs.push(config.projConfig);
if (config.localRepoConfig && fs.existsSync(config.localRepoConfig)) activeConfigs.push(config.localRepoConfig);

// No configs — fail-open
if (activeConfigs.length === 0) process.exit(0);

// Fail closed if any config is invalid JSON
for (const cfg of activeConfigs) {
  if (!validateConfig(cfg)) {
    process.stderr.write(`PATRONUM: config file '${cfg}' is invalid JSON — blocking all tool calls as safe default\n`);
    process.exit(2);
  }
}

const entries = loadAllEntries(config);

parseStdin().then((input) => {
  const command = (input.tool_input && input.tool_input.command) || '';
  if (!command) process.exit(0);

  for (const entry of entries) {
    if (!entry.pattern) continue;
    if (!entry.pattern.startsWith('Bash(') || !entry.pattern.endsWith(')')) continue;

    const blockedCmd = entry.pattern.slice(5, -1); // strip Bash(...)

    if (command === blockedCmd || command.startsWith(blockedCmd + ' ')) {
      const target = `Bash(${command})`;
      logViolation(config.logFile, { tool: 'Bash', target, pattern: entry.pattern });
      process.stderr.write(`PATRONUM_VIOLATION: Access to '${target}' blocked. Pattern: ${entry.pattern}\n`);
      if (entry.reason) process.stderr.write(`Reason: ${entry.reason}\n`);
      process.stderr.write('Manage with: /patronum-add or /patronum-remove in Claude Code\n');
      process.exit(2);
    }
  }

  process.exit(0);
});
