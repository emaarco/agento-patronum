#!/usr/bin/env node
/**
 * agento-patronum — UserPromptSubmit enforcement hook
 * Blocks @mention references to protected files before Claude sees their content.
 * Manage with: /patronum-add /patronum-remove /patronum-list
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { resolveConfig, loadAllEntries, validateConfig, matchGlob, parseStdin, logViolation } = require('./lib/patronum');

// Fail closed if HOME is unset
if (!process.env.HOME) {
  process.stderr.write('PATRONUM: HOME is unset — blocking prompt as safe default\n');
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

// Fail-open for invalid config in prompt hooks (don't block all user input)
for (const cfg of activeConfigs) {
  if (!validateConfig(cfg)) process.exit(0);
}

const entries = loadAllEntries(config);

parseStdin().then((input) => {
  const prompt = input.prompt || '';
  if (!prompt) process.exit(0);

  // Extract @<path> tokens — everything after @ until whitespace, quote, or backtick
  const mentions = prompt.match(/@[^\s"'`]+/g) || [];
  if (mentions.length === 0) process.exit(0);

  const home = process.env.HOME || '';

  for (const mention of mentions) {
    const raw = mention.slice(1); // strip @

    // Resolve to absolute path
    let absPath;
    if (raw.startsWith('/')) {
      absPath = raw;
    } else if (raw.startsWith('~')) {
      absPath = raw.replace(/^~/, home);
    } else {
      absPath = path.join(process.cwd(), raw);
    }

    // Check against file patterns (Bash patterns don't apply to file paths)
    for (const entry of entries) {
      if (!entry.pattern) continue;
      if (entry.pattern.startsWith('Bash(')) continue;

      if (matchGlob(absPath, entry.pattern)) {
        logViolation(config.logFile, { tool: 'UserPromptSubmit', target: mention, pattern: entry.pattern });
        process.stderr.write(`PATRONUM_VIOLATION: @mention '${mention}' references a protected file. Pattern: ${entry.pattern}\n`);
        if (entry.reason) process.stderr.write(`Reason: ${entry.reason}\n`);
        process.stderr.write('Manage with: /patronum-add or /patronum-remove in Claude Code\n');
        process.exit(2);
      }
    }
  }

  process.exit(0);
});
