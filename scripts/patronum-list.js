#!/usr/bin/env node
/**
 * agento-patronum — List all protected patterns
 * Usage: patronum-list.js
 */

'use strict';

const fs = require('fs');
const { resolveConfig, loadEntries } = require('./lib/patronum');

const config = resolveConfig();

function pad(str, len) {
  return (str || '').padEnd(len);
}

function printConfig(configPath, label) {
  if (!fs.existsSync(configPath)) return;
  const entries = loadEntries(configPath);
  console.log(`${label} (${entries.length} patterns)`);
  console.log(`Config: ${configPath}`);
  if (entries.length > 0) {
    console.log('');
    console.log(`  ${pad('PATTERN', 33)} ${pad('SOURCE', 10)} REASON`);
    console.log(`  ${pad('-------', 33)} ${pad('------', 10)} ------`);
    for (const e of entries) {
      console.log(`  ${pad(e.pattern, 33)} ${pad(e.source, 10)} ${e.reason || ''}`);
    }
  }
}

const hasUser = fs.existsSync(config.userConfig);
const hasProj = config.projConfig && fs.existsSync(config.projConfig);
const hasLocal = config.localRepoConfig && fs.existsSync(config.localRepoConfig);

if (!hasUser && !hasProj && !hasLocal) {
  process.stderr.write('Error: no config found. Run /patronum-verify to check setup.\n');
  process.exit(1);
}

printConfig(config.userConfig, 'User config (always active)');

if (hasProj) {
  console.log('');
  printConfig(config.projConfig, 'Project config (committed, merged on top)');
}

if (hasLocal) {
  console.log('');
  printConfig(config.localRepoConfig, 'Local repo config (gitignored, merged on top)');
}
