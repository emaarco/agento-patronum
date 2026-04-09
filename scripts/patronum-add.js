#!/usr/bin/env node
/**
 * agento-patronum — Add a pattern to the protection list
 * Usage: patronum-add.js "<pattern>" [--reason "reason"]
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { resolveConfig } = require('./lib/patronum');

const config = resolveConfig();
const args = process.argv.slice(2);

if (args.length < 1) {
  process.stderr.write('Usage: patronum-add.js "<pattern>" [--reason "reason"]\n');
  process.exit(1);
}

const pattern = args[0];
if (!pattern) {
  process.stderr.write('Error: pattern cannot be empty\n');
  process.exit(1);
}

let reason = '';
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--reason' && i + 1 < args.length) {
    reason = args[i + 1];
    i++;
  }
}

if (!fs.existsSync(config.activeConfig)) {
  process.stderr.write(`Error: ${config.activeConfig} not found. Run /patronum-verify to check setup.\n`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(config.activeConfig, 'utf8'));

// Check if pattern already exists
const existing = (data.entries || []).find((e) => e.pattern === pattern);
if (existing) {
  console.log(`Pattern '${pattern}' already exists in the protection list.`);
  process.exit(0);
}

const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

data.entries = data.entries || [];
data.entries.push({
  pattern,
  type: 'glob',
  reason,
  addedAt: timestamp,
  source: 'user',
});

// Atomic write via tmp + rename
const tmpFile = config.activeConfig + '.tmp';
fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2) + '\n');
fs.renameSync(tmpFile, config.activeConfig);

console.log(`Added pattern: ${pattern}`);
if (reason) console.log(`Reason: ${reason}`);
console.log(`Total patterns: ${data.entries.length}`);
