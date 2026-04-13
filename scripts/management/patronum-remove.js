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

  const existing = (data.entries || []).find((e) => e.pattern === pattern);
  if (!existing) {
    return { removed: false, remaining: (data.entries || []).length };
  }

  data.entries = data.entries.filter((e) => e.pattern !== pattern);

  // Atomic write via tmp + rename
  const tmpFile = configPath + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(tmpFile, configPath);

  return { removed: true, remaining: data.entries.length };
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
    console.log(`Pattern '${pattern}' not found in the protection list.`);
    process.exit(1);
  }

  console.log(`Removed pattern: ${pattern}`);
  console.log(`Remaining patterns: ${result.remaining}`);
}

module.exports = { removePattern };
