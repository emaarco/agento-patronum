#!/usr/bin/env node
/**
 * agento-patronum — Validate JSON files and default patterns
 * Replaces inline CI validation steps.
 */

'use strict';

const fs = require('fs');

const JSON_FILES = [
  '.claude-plugin/plugin.json',
  'hooks/hooks.json',
  'defaults/patronum.json',
];

let failed = 0;

for (const filePath of JSON_FILES) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`${filePath}: valid`);

    if (filePath === 'defaults/patronum.json') {
      const blacklist = data.blacklist || data.entries || [];
      const whitelist = data.whitelist || [];
      if (blacklist.length === 0) throw new Error('no default patterns found');
      console.log(`  default blacklist: ${blacklist.length}, whitelist: ${whitelist.length}`);
    }
  } catch (err) {
    console.error(`${filePath}: INVALID — ${err.message}`);
    failed++;
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log(`All ${JSON_FILES.length} JSON files valid.`);
