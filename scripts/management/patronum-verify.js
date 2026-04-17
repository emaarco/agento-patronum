#!/usr/bin/env node
/**
 * agento-patronum — Self-test to verify hook enforcement
 * Installation checks + integration smoke tests (pipes JSON through real hooks).
 * Detailed enforcement logic is tested in scripts/test/ via node:test.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '../..');
const fileHook = path.join(pluginRoot, 'scripts', 'hooks', 'patronum-file-hook.js');
const bashHook = path.join(pluginRoot, 'scripts', 'hooks', 'patronum-bash-hook.js');
const promptHook = path.join(pluginRoot, 'scripts', 'hooks', 'patronum-prompt-hook.js');
const configFile = path.join(process.env.HOME || '', '.claude', 'patronum', 'patronum.json');

let pass = 0;
let fail = 0;

// Passes JSON via stdin option instead of shell interpolation to prevent
// shell injection when input contains quotes or metacharacters.
// See: https://owasp.org/www-community/attacks/Command_Injection
function runHookTest({ name, hook, input, expect }) {
  let actualExit = 0;
  try {
    execSync(`node "${hook}"`, {
      input: JSON.stringify(input),
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
  } catch (err) {
    actualExit = err.status || 1;
  }

  if (actualExit === expect) {
    console.log(`  PASS: ${name} (exit ${actualExit})`);
    pass++;
  } else {
    console.log(`  FAIL: ${name} (expected exit ${expect}, got ${actualExit})`);
    fail++;
  }
}

let installFail = 0;

function checkInstall(description, result, detail) {
  if (result === 'pass') {
    console.log(`  PASS: ${description}`);
  } else {
    console.log(`  FAIL: ${description}${detail ? ' — ' + detail : ''}`);
    installFail++;
  }
}

console.log('agento-patronum: running self-test');
console.log('');

// ── Installation Check ────────────────────────────────────────────────────────
console.log('── Installation Check ──────────────────────────────────────────────────────');

if (process.env.CLAUDE_PLUGIN_ROOT) {
  console.log(`  INFO: CLAUDE_PLUGIN_ROOT set → ${pluginRoot}`);
} else {
  console.log(`  INFO: CLAUDE_PLUGIN_ROOT not set, using fallback → ${pluginRoot}`);
}

const expectedScripts = [
  'hooks/patronum-file-hook.js', 'hooks/patronum-bash-hook.js', 'hooks/patronum-prompt-hook.js',
  'setup/patronum-setup.js', 'setup/patronum-uninstall.js', 'setup/patronum-install-check.js',
  'management/patronum-add.js', 'management/patronum-remove.js',
  'management/patronum-list.js', 'management/patronum-verify.js',
];
for (const script of expectedScripts) {
  const scriptPath = path.join(pluginRoot, 'scripts', script);
  checkInstall(`scripts/${script} present`,
    fs.existsSync(scriptPath) ? 'pass' : 'fail',
    fs.existsSync(scriptPath) ? undefined : `not found at ${scriptPath}`);
}

const expectedLibs = ['config.js', 'matching.js', 'io.js', 'logging.js'];
for (const lib of expectedLibs) {
  const libPath = path.join(pluginRoot, 'scripts', 'lib', lib);
  checkInstall(`scripts/lib/${lib} present`,
    fs.existsSync(libPath) ? 'pass' : 'fail',
    fs.existsSync(libPath) ? undefined : `not found at ${libPath}`);
}

const defaultsPath = path.join(pluginRoot, 'defaults', 'patronum.json');
checkInstall('defaults/patronum.json present',
  fs.existsSync(defaultsPath) ? 'pass' : 'fail',
  fs.existsSync(defaultsPath) ? undefined : `not found at ${defaultsPath}`);

const patronumDir = path.join(process.env.HOME || '', '.claude', 'patronum');
if (!fs.existsSync(patronumDir)) {
  checkInstall('~/.claude/patronum/ directory exists', 'fail', 'run setup or reinstall the plugin');
} else if (!fs.existsSync(configFile)) {
  checkInstall('~/.claude/patronum/patronum.json exists', 'fail', 'run setup or reinstall the plugin');
} else {
  try {
    JSON.parse(fs.readFileSync(configFile, 'utf8'));
    checkInstall('~/.claude/patronum/patronum.json valid JSON', 'pass');
  } catch {
    console.debug('patronum: could not parse config for validation');
    checkInstall('~/.claude/patronum/patronum.json valid JSON', 'fail', 'file is malformed — delete it and re-run setup');
  }
}

if (installFail > 0) {
  console.log('');
  console.log(`Installation check failed (${installFail} issue(s)). Fix the above before running enforcement tests.`);
  process.exit(1);
}

console.log('');

// ── Scope Coverage Check ────────────────────────────────────────────────────
console.log('── Scope Coverage Check ────────────────────────────────────────────────────');

const home = process.env.HOME || '';
const userSettingsPath = path.join(home, '.claude', 'settings.json');
let userScopeInstalled = false;
if (fs.existsSync(userSettingsPath)) {
  try {
    const userSettings = JSON.parse(fs.readFileSync(userSettingsPath, 'utf8'));
    const plugins = userSettings.enabledPlugins || {};
    userScopeInstalled = Object.entries(plugins).some(([k, v]) => k.startsWith('agento-patronum') && v === true);
  } catch { /* ignore parse errors */ }
}

let projectScopeInstalled = false;
let localScopeInstalled = false;
let gitRoot = '';
try {
  gitRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
} catch { /* not in a git repo */ }

if (gitRoot) {
  const settingsPath = path.join(gitRoot, '.claude', 'settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      const plugins = settings.enabledPlugins || {};
      projectScopeInstalled = Object.entries(plugins).some(([k, v]) => k.startsWith('agento-patronum') && v === true);
    } catch { /* ignore */ }
  }
  const localSettingsPath = path.join(gitRoot, '.claude', 'settings.local.json');
  if (fs.existsSync(localSettingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(localSettingsPath, 'utf8'));
      const plugins = settings.enabledPlugins || {};
      localScopeInstalled = Object.entries(plugins).some(([k, v]) => k.startsWith('agento-patronum') && v === true);
    } catch { /* ignore */ }
  }
}

if (userScopeInstalled) {
  console.log('  PASS: user-scope install detected — subagents are protected.');
} else if (projectScopeInstalled || localScopeInstalled) {
  console.log('  WARN: agento-patronum not installed at user scope — subagents are not protected.');
  console.log('        Install at user scope: /plugin install agento-patronum@emaarco');
  console.log('        Details: https://emaarco.github.io/agento-patronum/internals/security-considerations');
} else {
  console.log('  INFO: scope detection skipped (not in a git repo or no project/local settings found).');
}

console.log('');

// ── Smoke Tests ──────────────────────────────────────────────────────────────
// These verify the full hook pipeline (stdin → enforce → exit code).
// Detailed pattern matching is tested in scripts/test/ via node:test.

console.log('── File Hook Smoke Tests ────────────────────────────────────────────────────');
console.log('');

runHookTest({
  name: 'Block Read .env',
  hook: fileHook,
  input: { tool_name: 'Read', tool_input: { file_path: '/project/.env' } },
  expect: 2,
});

runHookTest({
  name: 'Allow Read /tmp/safe.txt',
  hook: fileHook,
  input: { tool_name: 'Read', tool_input: { file_path: '/tmp/safe.txt' } },
  expect: 0,
});

runHookTest({
  name: 'Block MultiEdit .env',
  hook: fileHook,
  input: { tool_name: 'MultiEdit', tool_input: { edits: [{ file_path: '/project/.env', old_string: 'x', new_string: 'y' }] } },
  expect: 2,
});

console.log('');
console.log('── Bash Hook Smoke Tests ────────────────────────────────────────────────────');
console.log('');

runHookTest({
  name: 'Block Bash(printenv)',
  hook: bashHook,
  input: { tool_input: { command: 'printenv' } },
  expect: 2,
});

runHookTest({
  name: 'Allow Bash(ls -la)',
  hook: bashHook,
  input: { tool_input: { command: 'ls -la' } },
  expect: 0,
});

console.log('');
console.log('── Prompt Hook Smoke Tests ──────────────────────────────────────────────────');
console.log('');

runHookTest({
  name: 'Block @mention to .env',
  hook: promptHook,
  input: { prompt: 'show me @project/.env' },
  expect: 2,
});

runHookTest({
  name: 'Allow prompt with no @mentions',
  hook: promptHook,
  input: { prompt: 'what is 2+2' },
  expect: 0,
});

// ── No-config fail-closed test ───────────────────────────────────────────────
console.log('');
console.log('── Fail-Closed Test ────────────────────────────────────────────────────────');
console.log('');

const tempAbsent = configFile + '.verify-absent';
let skipNoConfig = false;
try {
  fs.renameSync(configFile, tempAbsent);
} catch {
  console.debug('patronum: could not rename config for fail-closed test');
  skipNoConfig = true;
}
if (!skipNoConfig && !fs.existsSync(configFile)) {
  runHookTest({
    name: 'No-config: block all (fail-closed)',
    hook: fileHook,
    input: { tool_name: 'Read', tool_input: { file_path: `${home}/.ssh/id_rsa` } },
    expect: 2,
  });
  fs.renameSync(tempAbsent, configFile);
} else {
  console.log('  SKIP: could not temporarily remove config for no-config test');
  if (fs.existsSync(tempAbsent)) fs.renameSync(tempAbsent, configFile);
}

console.log('');
console.log(`Results: ${pass} passed, ${fail} failed`);

if (fail > 0) {
  process.exit(1);
}

console.log('');
console.log('agento-patronum: all tests passed. Your guardian is active.');
