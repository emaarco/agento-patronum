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

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
const fileHook = path.join(pluginRoot, 'scripts', 'patronum-file-hook.js');
const bashHook = path.join(pluginRoot, 'scripts', 'patronum-bash-hook.js');
const promptHook = path.join(pluginRoot, 'scripts', 'patronum-prompt-hook.js');
const configFile = path.join(process.env.HOME || '', '.claude', 'patronum', 'patronum.json');

let pass = 0;
let fail = 0;

function runHookTest({ name, hook, input, expect }) {
  const json = JSON.stringify(input).replace(/'/g, "'\\''");
  let actualExit = 0;
  try {
    execSync(`echo '${json}' | node "${hook}"`, {
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
let installFail = 0;

if (process.env.CLAUDE_PLUGIN_ROOT) {
  console.log(`  INFO: CLAUDE_PLUGIN_ROOT set → ${pluginRoot}`);
} else {
  console.log(`  INFO: CLAUDE_PLUGIN_ROOT not set, using fallback → ${pluginRoot}`);
}

const expectedScripts = [
  'patronum-file-hook.js', 'patronum-bash-hook.js', 'patronum-prompt-hook.js',
  'patronum-setup.js', 'patronum-add.js', 'patronum-remove.js',
  'patronum-list.js', 'patronum-verify.js', 'patronum-uninstall.js',
  'patronum-install-check.js',
];
for (const script of expectedScripts) {
  const scriptPath = path.join(pluginRoot, 'scripts', script);
  checkInstall(`scripts/${script} present`,
    fs.existsSync(scriptPath) ? 'pass' : 'fail',
    fs.existsSync(scriptPath) ? undefined : `not found at ${scriptPath}`);
}

const expectedLibs = ['patronum.js', 'enforce.js', 'runHook.js'];
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
    checkInstall('~/.claude/patronum/patronum.json valid JSON', 'fail', 'file is malformed — delete it and re-run setup');
  }
}

if (installFail > 0) {
  console.log('');
  console.log(`Installation check failed (${installFail} issue(s)). Fix the above before running enforcement tests.`);
  process.exit(1);
}

console.log('');

// ── Smoke Tests ──────────────────────────────────────────────────────────────
// These verify the full hook pipeline (stdin → enforce → exit code).
// Detailed pattern matching is tested in scripts/test/ via node:test.

const home = process.env.HOME || '';

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

// ── No-config fail-open test ─────────────────────────────────────────────────
console.log('');
console.log('── Fail-Open Test ──────────────────────────────────────────────────────────');
console.log('');

const tempAbsent = configFile + '.verify-absent';
let skipNoConfig = false;
try {
  fs.renameSync(configFile, tempAbsent);
} catch {
  skipNoConfig = true;
}
if (!skipNoConfig && !fs.existsSync(configFile)) {
  runHookTest({
    name: 'No-config: allow all (fail-open)',
    hook: fileHook,
    input: { tool_name: 'Read', tool_input: { file_path: `${home}/.ssh/id_rsa` } },
    expect: 0,
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
