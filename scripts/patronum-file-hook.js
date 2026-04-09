#!/usr/bin/env node
/**
 * agento-patronum — PreToolUse file enforcement hook
 * Blocks Read/Write/Edit/MultiEdit operations on protected file paths.
 * Manage with: /patronum-add /patronum-remove /patronum-list
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { resolveConfig, loadAllEntries, validateConfig, matchGlob, parseStdin, logViolation } = require('./lib/patronum');

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

function checkFilePath(filePath, toolName) {
  for (const entry of entries) {
    if (!entry.pattern) continue;
    if (entry.pattern.startsWith('Bash(')) continue; // Bash patterns don't apply to file paths

    if (matchGlob(filePath, entry.pattern)) {
      logViolation(config.logFile, { tool: toolName, target: filePath, pattern: entry.pattern });
      process.stderr.write(`PATRONUM_VIOLATION: Access to '${filePath}' blocked. Pattern: ${entry.pattern}\n`);
      if (entry.reason) process.stderr.write(`Reason: ${entry.reason}\n`);
      process.stderr.write('Manage with: /patronum-add or /patronum-remove in Claude Code\n');
      process.exit(2);
    }
  }
}

parseStdin().then((input) => {
  const toolName = input.tool_name || '';
  if (!toolName) process.exit(0);

  switch (toolName) {
    case 'Read':
    case 'Write':
    case 'Edit': {
      const filePath = (input.tool_input && input.tool_input.file_path) || '';
      if (!filePath) process.exit(0);
      checkFilePath(filePath, toolName);
      break;
    }
    case 'MultiEdit': {
      const edits = (input.tool_input && input.tool_input.edits) || [];
      for (const edit of edits) {
        if (edit.file_path) checkFilePath(edit.file_path, toolName);
      }
      break;
    }
  }

  process.exit(0);
});
