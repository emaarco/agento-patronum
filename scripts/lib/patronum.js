/**
 * agento-patronum — shared library
 * Config resolution, pattern matching, stdin reading, log writing.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Config resolution ────────────────────────────────────────────────────────

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
    } catch { /* not in a git repo */ }
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

// ── Config loading ───────────────────────────────────────────────────────────

function validateConfig(configPath) {
  try {
    JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return true;
  } catch {
    return false;
  }
}

function loadEntries(configPath) {
  try {
    const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return data.entries || [];
  } catch {
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

// ── Glob matching ────────────────────────────────────────────────────────────
// Ports bash's [[ "$path" == $pattern ]] where * matches everything including /

function globTest(str, pattern) {
  const re = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp('^' + re + '$').test(str);
}

function matchGlob(filePath, pattern, home) {
  home = home || process.env.HOME || '';
  let p = pattern.replace(/^~/, home);
  let fp = filePath.replace(/^~/, home);

  // Normalize **/ to */ — bash [[ ]] treats * as matching /
  p = p.replace(/\*\*\//g, '*/');

  // Check for leading */ pattern — also match bare basename
  const isDeep = p.startsWith('*/');
  const bnPattern = isDeep ? p.slice(2) : null;

  if (globTest(fp, p)) return true;
  if (bnPattern) return globTest(path.basename(fp), bnPattern);
  return false;
}

// ── Stdin reading ────────────────────────────────────────────────────────────

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
  });
}

async function parseStdin() {
  const raw = await readStdin();
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

// ── Logging ──────────────────────────────────────────────────────────────────

function logViolation(logFile, { tool, target, pattern }) {
  const entry = JSON.stringify({
    ts: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    tool,
    target,
    pattern,
  });
  try {
    fs.appendFileSync(logFile, entry + '\n');
  } catch { /* best effort */ }
}

// ── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  resolveConfig,
  validateConfig,
  loadEntries,
  loadAllEntries,
  matchGlob,
  globTest,
  readStdin,
  parseStdin,
  logViolation,
};
