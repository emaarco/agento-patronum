#!/usr/bin/env node
/**
 * agento-patronum — Self-test to verify hook enforcement
 * Usage: patronum-verify.js
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

function runHookTest(description, hookPath, input, expectedExit) {
  let actualExit = 0;
  try {
    execSync(`echo '${input.replace(/'/g, "'\\''")}' | node "${hookPath}"`, {
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
  } catch (err) {
    actualExit = err.status || 1;
  }

  if (actualExit === expectedExit) {
    console.log(`  PASS: ${description} (exit ${actualExit})`);
    pass++;
  } else {
    console.log(`  FAIL: ${description} (expected exit ${expectedExit}, got ${actualExit})`);
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

// Show CLAUDE_PLUGIN_ROOT resolution
if (process.env.CLAUDE_PLUGIN_ROOT) {
  console.log(`  INFO: CLAUDE_PLUGIN_ROOT set → ${pluginRoot}`);
} else {
  console.log(`  INFO: CLAUDE_PLUGIN_ROOT not set, using fallback → ${pluginRoot}`);
}

// Check all expected scripts exist
const expectedScripts = [
  'patronum-file-hook.js', 'patronum-bash-hook.js', 'patronum-prompt-hook.js',
  'patronum-setup.js', 'patronum-add.js', 'patronum-remove.js',
  'patronum-list.js', 'patronum-verify.js', 'patronum-uninstall.js',
  'patronum-install-check.js',
];
for (const script of expectedScripts) {
  const scriptPath = path.join(pluginRoot, 'scripts', script);
  if (fs.existsSync(scriptPath)) {
    checkInstall(`scripts/${script} present`, 'pass');
  } else {
    checkInstall(`scripts/${script} present`, 'fail', `not found at ${scriptPath}`);
  }
}

// Check shared lib
const libPath = path.join(pluginRoot, 'scripts', 'lib', 'patronum.js');
if (fs.existsSync(libPath)) {
  checkInstall('scripts/lib/patronum.js present', 'pass');
} else {
  checkInstall('scripts/lib/patronum.js present', 'fail', `not found at ${libPath}`);
}

// Check defaults file
const defaultsPath = path.join(pluginRoot, 'defaults', 'patronum.json');
if (fs.existsSync(defaultsPath)) {
  checkInstall('defaults/patronum.json present', 'pass');
} else {
  checkInstall('defaults/patronum.json present', 'fail', `not found at ${defaultsPath}`);
}

// Check config directory and user config
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

// ── File Hook Tests ───────────────────────────────────────────────────────────
console.log('── File Hook Tests (patronum-file-hook.js) ─────────────────────────────────');
console.log('');
console.log(`Config: ${configFile}`);
console.log(`Hook:   ${fileHook}`);
console.log('');

const home = process.env.HOME || '';

// Should block reading SSH key
runHookTest('Block Read ~/.ssh/id_rsa',
  fileHook,
  `{"tool_name":"Read","tool_input":{"file_path":"${home}/.ssh/id_rsa"}}`,
  2);

// Should block reading .env file
runHookTest('Block Read .env',
  fileHook,
  '{"tool_name":"Read","tool_input":{"file_path":"/project/.env"}}',
  2);

// Should block AWS credentials
runHookTest('Block Read ~/.aws/credentials',
  fileHook,
  `{"tool_name":"Read","tool_input":{"file_path":"${home}/.aws/credentials"}}`,
  2);

// Should allow safe file
runHookTest('Allow Read /tmp/safe.txt',
  fileHook,
  '{"tool_name":"Read","tool_input":{"file_path":"/tmp/safe.txt"}}',
  0);

// Should block .pem files
runHookTest('Block Read server.pem',
  fileHook,
  '{"tool_name":"Read","tool_input":{"file_path":"/etc/ssl/server.pem"}}',
  2);

// Should block Write to .env.local
runHookTest('Block Write .env.local',
  fileHook,
  '{"tool_name":"Write","tool_input":{"file_path":"/project/.env.local"}}',
  2);

// Should block Edit on .env
runHookTest('Block Edit .env',
  fileHook,
  '{"tool_name":"Edit","tool_input":{"file_path":"/project/.env"}}',
  2);

// Should block MultiEdit touching a protected file
runHookTest('Block MultiEdit .env',
  fileHook,
  '{"tool_name":"MultiEdit","tool_input":{"edits":[{"file_path":"/project/.env","old_string":"x","new_string":"y"}]}}',
  2);

// Should allow MultiEdit on a safe file
runHookTest('Allow MultiEdit safe file',
  fileHook,
  '{"tool_name":"MultiEdit","tool_input":{"edits":[{"file_path":"/tmp/safe.txt","old_string":"x","new_string":"y"}]}}',
  0);

// No-config guard — with a nonexistent config, hook should allow (fail-open)
const tempAbsent = configFile + '.verify-absent';
let skipNoConfig = false;
try {
  fs.renameSync(configFile, tempAbsent);
} catch {
  skipNoConfig = true;
}
if (!skipNoConfig && !fs.existsSync(configFile)) {
  runHookTest('No-config: allow all (fail-open)',
    fileHook,
    `{"tool_name":"Read","tool_input":{"file_path":"${home}/.ssh/id_rsa"}}`,
    0);
  fs.renameSync(tempAbsent, configFile);
} else {
  console.log('  SKIP: could not temporarily remove config for no-config test');
  if (fs.existsSync(tempAbsent)) fs.renameSync(tempAbsent, configFile);
}

console.log('');

// ── Bash Hook Tests ───────────────────────────────────────────────────────────
console.log('── Bash Hook Tests (patronum-bash-hook.js) ─────────────────────────────────');
console.log('');
console.log(`Config: ${configFile}`);
console.log(`Hook:   ${bashHook}`);
console.log('');

// Should block printenv command
runHookTest('Block Bash(printenv)',
  bashHook,
  '{"tool_input":{"command":"printenv"}}',
  2);

// Should allow safe command
runHookTest('Allow Bash(ls -la)',
  bashHook,
  '{"tool_input":{"command":"ls -la"}}',
  0);

// Should allow set with options
runHookTest('Allow Bash(set -euo pipefail)',
  bashHook,
  '{"tool_input":{"command":"set -euo pipefail"}}',
  0);

// Should allow env with variable assignment
runHookTest('Allow Bash(env NODE_ENV=test npm run build)',
  bashHook,
  '{"tool_input":{"command":"env NODE_ENV=test npm run build"}}',
  0);

// Regression: Bash command mentioning a protected filename in its text should NOT be blocked
runHookTest('No false-positive: .env.local in Bash body text',
  bashHook,
  '{"tool_input":{"command":"gh issue create --body \\"see .env.local for details\\""}}',
  0);

console.log('');

// ── Prompt Hook Tests ─────────────────────────────────────────────────────────
console.log('── Prompt Hook Tests (patronum-prompt-hook.js) ──────────────────────────────');
console.log('');
console.log(`Config: ${configFile}`);
console.log(`Hook:   ${promptHook}`);
console.log('');

// Should block @mention to .env.local
runHookTest('Block @mention to .env.local',
  promptHook,
  '{"prompt":"whats in @stack/.env.local"}',
  2);

// Should block @mention to .env
runHookTest('Block @mention to .env',
  promptHook,
  '{"prompt":"show me @project/.env"}',
  2);

// Should block @mention to SSH key
runHookTest('Block @mention to ~/.ssh/id_rsa',
  promptHook,
  '{"prompt":"read @~/.ssh/id_rsa"}',
  2);

// Should allow @mention to safe file
runHookTest('Allow @mention to README.md',
  promptHook,
  '{"prompt":"check @README.md"}',
  0);

// Should allow prompt with no @mentions
runHookTest('Allow prompt with no @mentions',
  promptHook,
  '{"prompt":"what is 2+2"}',
  0);

console.log('');
console.log(`Results: ${pass} passed, ${fail} failed`);

if (fail > 0) {
  process.exit(1);
}

console.log('');
console.log('agento-patronum: all tests passed. Your guardian is active.');
