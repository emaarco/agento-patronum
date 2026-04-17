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
    // Migration: v1 used `entries` key (all blacklist); v2 uses `blacklist`/`whitelist`
    const blacklist = data.blacklist || data.entries || [];
    const whitelist = data.whitelist || [];
    return { blacklist, whitelist };
  } catch {
    console.debug('patronum: could not load entries from', configPath);
    return { blacklist: [], whitelist: [] };
  }
}

function loadAllEntries(config) {
  const cfg = config || resolveConfig();
  const blacklist = [];
  const whitelist = [];
  for (const cfgPath of [cfg.userConfig, cfg.projConfig, cfg.localRepoConfig]) {
    if (!cfgPath || !fs.existsSync(cfgPath)) continue;
    const { blacklist: bl, whitelist: wl } = loadEntries(cfgPath);
    blacklist.push(...bl);
    whitelist.push(...wl);
  }
  return { blacklist, whitelist };
}

function requireHome() {
  if (!process.env.HOME) {
    process.stderr.write('PATRONUM: Cannot locate config directory — blocking all operations.\n');
    process.exit(2);
  }
}

function getActiveConfigs(config) {
  return [config.userConfig, config.projConfig, config.localRepoConfig]
    .filter(c => c && fs.existsSync(c));
}

function validateActiveConfigs(activeConfigs, { failOpen = false } = {}) {
  for (const cfg of activeConfigs) {
    if (!validateConfig(cfg)) {
      if (failOpen) process.exit(0);
      process.stderr.write(`PATRONUM: Config '${cfg}' contains invalid JSON — blocking all operations until fixed.\n`);
      process.exit(2);
    }
  }
}

function loadBlacklist({ failOpen = false } = {}) {
  requireHome();
  const config = resolveConfig();
  const activeConfigs = getActiveConfigs(config);
  if (activeConfigs.length === 0) {
    process.stderr.write('PATRONUM: No config found — blocking all operations. Run /patronum-verify to check setup.\n');
    process.exit(2);
  }
  validateActiveConfigs(activeConfigs, { failOpen });
  const { blacklist, whitelist } = loadAllEntries(config);
  return { config, blacklist, whitelist };
}

module.exports = {
  resolveConfig, validateConfig, loadEntries, loadAllEntries,
  requireHome, getActiveConfigs, validateActiveConfigs, loadBlacklist,
};
