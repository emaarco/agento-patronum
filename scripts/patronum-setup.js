#!/usr/bin/env node
/**
 * agento-patronum — SessionStart hook
 * Copies default config on first run. Safe to run every session.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const home = process.env.HOME || '';
const patronumDir = path.join(home, '.claude', 'patronum');
const configFile = path.join(patronumDir, 'patronum.json');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
if (!process.env.CLAUDE_PLUGIN_ROOT) {
  process.stderr.write(`agento-patronum: warning: CLAUDE_PLUGIN_ROOT not set, using fallback path: ${pluginRoot}\n`);
}
const defaults = path.join(pluginRoot, 'defaults', 'patronum.json');

// Ensure user config directory exists
fs.mkdirSync(patronumDir, { recursive: true });

// Initialise user config if missing
if (!fs.existsSync(configFile)) {
  fs.copyFileSync(defaults, configFile);
  console.log('agento-patronum: first-time setup complete. Default protections installed.');
}

// Detect project-scope or local-scope install and create the appropriate repo config
let gitRoot = '';
try {
  gitRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
} catch { /* not in a git repo */ }

if (gitRoot) {
  const repoDir = path.join(gitRoot, '.claude', 'patronum');

  // Project scope: agento-patronum listed in committed .claude/settings.json
  const settingsPath = path.join(gitRoot, '.claude', 'settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      const plugins = settings.enabledPlugins || {};
      const isEnabled = Object.entries(plugins).some(([k, v]) => k.startsWith('agento-patronum') && v === true);
      if (isEnabled) {
        fs.mkdirSync(repoDir, { recursive: true });
        const projConfig = path.join(repoDir, 'patronum.json');
        if (!fs.existsSync(projConfig)) {
          fs.copyFileSync(defaults, projConfig);
          console.log('agento-patronum: project-scope install detected.');
          console.log(`agento-patronum: created ${repoDir}/patronum.json with default protections.`);
          console.log('agento-patronum: commit this file to share protection rules with your team.');
          console.log('agento-patronum: add .claude/patronum/patronum.log to your .gitignore.');
        }
      }
    } catch { /* malformed settings.json — skip */ }
  }

  // Local scope: agento-patronum listed in gitignored .claude/settings.local.json
  const localSettingsPath = path.join(gitRoot, '.claude', 'settings.local.json');
  if (fs.existsSync(localSettingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(localSettingsPath, 'utf8'));
      const plugins = settings.enabledPlugins || {};
      const isEnabled = Object.entries(plugins).some(([k, v]) => k.startsWith('agento-patronum') && v === true);
      if (isEnabled) {
        fs.mkdirSync(repoDir, { recursive: true });
        const localConfig = path.join(repoDir, 'patronum.local.json');
        if (!fs.existsSync(localConfig)) {
          fs.copyFileSync(defaults, localConfig);
          console.log('agento-patronum: local-scope install detected.');
          console.log(`agento-patronum: created ${repoDir}/patronum.local.json with default protections.`);
          console.log('agento-patronum: this file is personal — add it to your .gitignore.');
        }
      }
    } catch { /* malformed settings.local.json — skip */ }
  }
}

// Report status
try {
  const data = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  const count = (data.entries || []).length;
  console.log(`agento-patronum: protection active. ${count} patterns loaded.`);
} catch {
  console.log('agento-patronum: protection active.');
}
