/**
 * agento-patronum — Config resolution and loading
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function resolveConfig() {
  const home = process.env.HOME || '';
  const patronumDir = path.join(home, '.claude', 'patronum');
  const userConfig = path.join(patronumDir, 'patronum.json');
  let projConfig = '';
  let localRepoConfig = '';
  let activeConfig = userConfig;
  let logFile = path.join(patronumDir, 'patronum.log');

  // Derive project root: prefer CLAUDE_PLUGIN_ROOT over git rev-parse
  let projectRoot = '';
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || '';
  if (pluginRoot) {
    const candidate = path.dirname(path.dirname(pluginRoot));
    if (
      fs.existsSync(path.join(candidate, '.claude', 'patronum', 'patronum.json')) ||
      fs.existsSync(path.join(candidate, '.claude', 'patronum', 'patronum.local.json'))
    ) {
      projectRoot = candidate;
    }
  }
  if (!projectRoot) {
    try {
      projectRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch {
      console.debug('patronum: not in a git repo, skipping project config');
    }
  }

  if (projectRoot) {
    const proj = path.join(projectRoot, '.claude', 'patronum', 'patronum.json');
    const local = path.join(projectRoot, '.claude', 'patronum', 'patronum.local.json');
    if (fs.existsSync(proj)) {
      projConfig = proj;
      activeConfig = proj;
      logFile = path.join(projectRoot, '.claude', 'patronum', 'patronum.log');
    }
    if (fs.existsSync(local)) {
      localRepoConfig = local;
      if (!projConfig) {
        activeConfig = local;
        logFile = path.join(projectRoot, '.claude', 'patronum', 'patronum.log');
      }
    }
  }

  return { userConfig, projConfig, localRepoConfig, activeConfig, logFile, patronumDir };
}

function validateConfig(configPath) {
  try {
    JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return true;
  } catch {
    console.debug('patronum: config validation failed for', configPath);
    return false;
  }
}

function loadEntries(configPath) {
  try {
    const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return data.entries || [];
  } catch {
    console.debug('patronum: could not load entries from', configPath);
    return [];
  }
}

function loadAllEntries(config) {
  const cfg = config || resolveConfig();
  const entries = [];
  if (fs.existsSync(cfg.userConfig)) entries.push(...loadEntries(cfg.userConfig));
  if (cfg.projConfig && fs.existsSync(cfg.projConfig)) entries.push(...loadEntries(cfg.projConfig));
  if (cfg.localRepoConfig && fs.existsSync(cfg.localRepoConfig)) entries.push(...loadEntries(cfg.localRepoConfig));
  return entries;
}

module.exports = { resolveConfig, validateConfig, loadEntries, loadAllEntries };
