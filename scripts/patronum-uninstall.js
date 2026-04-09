#!/usr/bin/env node
/**
 * agento-patronum — Remove all patronum data files
 * Usage: node scripts/patronum-uninstall.js
 *
 * This script removes patronum config and log files only.
 * To also remove the plugin itself, run first:
 *   claude plugin uninstall agento-patronum@emaarco
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let removed = 0;

// ── User-scope config (~/.claude/patronum/) ───────────────────────────────────
const patronumDir = path.join(process.env.HOME || '', '.claude', 'patronum');
if (fs.existsSync(patronumDir)) {
  const configFile = path.join(patronumDir, 'patronum.json');
  let count = 'unknown';
  if (fs.existsSync(configFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      count = (data.entries || []).length;
    } catch { console.debug('patronum: could not read config for pattern count'); }
  }
  fs.rmSync(patronumDir, { recursive: true, force: true });
  console.log(`agento-patronum: removed ${patronumDir} (${count} patterns in user config)`);
  removed++;
} else {
  console.log(`agento-patronum: no user config found at ${patronumDir}`);
}

// ── Repo-scope config (.claude/patronum/ inside git repo) ────────────────────
let gitRoot = '';
try {
  gitRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
} catch { console.debug('patronum: not in a git repo, skipping repo-scope cleanup'); }

if (gitRoot) {
  const repoPatronum = path.join(gitRoot, '.claude', 'patronum');
  if (fs.existsSync(repoPatronum)) {
    fs.rmSync(repoPatronum, { recursive: true, force: true });
    console.log(`agento-patronum: removed repo config at ${repoPatronum}`);
    removed++;
  } else {
    console.log(`agento-patronum: no repo config found at ${repoPatronum}`);
  }
} else {
  console.log('agento-patronum: not inside a git repo — skipping repo-scope cleanup');
}

// ── Summary ───────────────────────────────────────────────────────────────────
if (removed > 0) {
  console.log('');
  console.log('agento-patronum: data cleanup complete.');
  console.log('To finish uninstalling, run: claude plugin uninstall agento-patronum@emaarco');
} else {
  console.log('agento-patronum: nothing to clean up.');
}
