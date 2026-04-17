#!/usr/bin/env node
/**
 * agento-patronum — Remove a pattern from the protection list
 * Usage: patronum-remove.js "<pattern>"
 */

'use strict';

const fs = require('fs');
const { resolveConfig } = require('../lib/config');

function removePattern(configPath, pattern) {
  const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  // Migration: v1 used `entries` key (all blacklist)
  if (!data.blacklist && data.entries) {
    data.blacklist = data.entries;
    delete data.entries;
  }
  data.blacklist = data.blacklist || [];
  data.whitelist = data.whitelist || [];

  let fromList = '';
  if (data.blacklist.find((e) => e.pattern === pattern)) {
    data.blacklist = data.blacklist.filter((e) => e.pattern !== pattern);
    fromList = 'blacklist';
  } else if (data.whitelist.find((e) => e.pattern === pattern)) {
    data.whitelist = data.whitelist.filter((e) => e.pattern !== pattern);
    fromList = 'whitelist';
  }

  if (!fromList) {
    return { removed: false, remaining: data.blacklist.length + data.whitelist.length };
  }

  // Atomic write via tmp + rename
  const tmpFile = configPath + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(tmpFile, configPath);

  return { removed: true, fromList, remaining: data.blacklist.length + data.whitelist.length };
}

// ── CLI entry point ─────────────────────────────────────────────────────────

if (require.main === module) {
  const config = resolveConfig();
  const args = process.argv.slice(2);

  if (args.length < 1) {
    process.stderr.write('Usage: patronum-remove.js "<pattern>"\n');
    process.exit(1);
  }

  const pattern = args[0];

  if (!fs.existsSync(config.activeConfig)) {
    process.stderr.write(`Error: ${config.activeConfig} not found. Run /patronum-verify to check setup.\n`);
    process.exit(1);
  }

  const result = removePattern(config.activeConfig, pattern);

  if (!result.removed) {
    console.log(`Pattern '${pattern}' not found in blacklist or whitelist.`);
    process.exit(1);
  }

  console.log(`Removed pattern: ${pattern} (from ${result.fromList})`);
  console.log(`Remaining patterns: ${result.remaining}`);
}

module.exports = { removePattern };
