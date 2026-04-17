#!/usr/bin/env node
/**
 * agento-patronum — List all protected patterns
 * Usage: patronum-list.js
 */

'use strict';

const fs = require('fs');
const { resolveConfig, loadEntries } = require('../lib/config');

function pad(str, len) {
  return (str || '').padEnd(len);
}

function formatEntries(entries) {
  if (entries.length === 0) return [];

  const lines = [];
  lines.push(`  ${pad('PATTERN', 33)} ${pad('SOURCE', 10)} REASON`);
  lines.push(`  ${pad('-------', 33)} ${pad('------', 10)} ------`);
  for (const e of entries) {
    lines.push(`  ${pad(e.pattern, 33)} ${pad(e.source, 10)} ${e.reason || ''}`);
  }
  return lines;
}

// ── CLI entry point ─────────────────────────────────────────────────────────

if (require.main === module) {
  const config = resolveConfig();

  function printConfig(configPath, label) {
    if (!fs.existsSync(configPath)) return;
    const { blacklist, whitelist } = loadEntries(configPath);
    const total = blacklist.length + whitelist.length;
    console.log(`${label} (${total} patterns)`);
    console.log(`Config: ${configPath}`);
    if (blacklist.length > 0) {
      console.log('');
      console.log('  Blacklist:');
      for (const line of formatEntries(blacklist)) {
        console.log(line);
      }
    }
    if (whitelist.length > 0) {
      console.log('');
      console.log('  Whitelist:');
      for (const line of formatEntries(whitelist)) {
        console.log(line);
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
}

module.exports = { formatEntries };
