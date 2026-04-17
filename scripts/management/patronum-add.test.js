'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const { strictEqual, ok } = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { addPattern } = require('./patronum-add');

let tmpDir;
let configPath;

function writeConfig(blacklist, whitelist = []) {
  fs.writeFileSync(configPath, JSON.stringify({ blacklist, whitelist }, null, 2) + '\n');
}

function readConfig() {
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'patronum-add-test-'));
  configPath = path.join(tmpDir, 'patronum.json');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('addPattern', () => {
  it('adds a new pattern to blacklist by default', () => {
    writeConfig([]);
    const result = addPattern(configPath, '**/.env', 'secrets');
    strictEqual(result.added, true);
    strictEqual(result.total, 1);

    const data = readConfig();
    strictEqual(data.blacklist[0].pattern, '**/.env');
    strictEqual(data.blacklist[0].reason, 'secrets');
    strictEqual(data.blacklist[0].type, 'glob');
    strictEqual(data.blacklist[0].source, 'user');
    ok(data.blacklist[0].addedAt);
  });

  it('adds a new pattern to whitelist when list=whitelist', () => {
    writeConfig([]);
    const result = addPattern(configPath, '**/.env.example', 'safe', { list: 'whitelist' });
    strictEqual(result.added, true);
    strictEqual(result.total, 1);

    const data = readConfig();
    strictEqual(data.whitelist[0].pattern, '**/.env.example');
    strictEqual(data.whitelist[0].source, 'user');
    strictEqual(data.blacklist.length, 0);
  });

  it('returns duplicate for existing blacklist pattern', () => {
    writeConfig([{ pattern: '**/.env', reason: 'existing' }]);
    const result = addPattern(configPath, '**/.env', 'new reason');
    strictEqual(result.added, false);
    strictEqual(result.reason, 'duplicate');

    const data = readConfig();
    strictEqual(data.blacklist.length, 1);
    strictEqual(data.blacklist[0].reason, 'existing');
  });

  it('returns duplicate for existing whitelist pattern', () => {
    writeConfig([], [{ pattern: '**/.env.example', reason: 'existing' }]);
    const result = addPattern(configPath, '**/.env.example', 'new reason', { list: 'whitelist' });
    strictEqual(result.added, false);
    strictEqual(result.reason, 'duplicate');
  });

  it('preserves existing entries', () => {
    writeConfig([{ pattern: 'a' }, { pattern: 'b' }]);
    addPattern(configPath, 'c', '');

    const data = readConfig();
    strictEqual(data.blacklist.length, 3);
    strictEqual(data.blacklist[0].pattern, 'a');
    strictEqual(data.blacklist[1].pattern, 'b');
    strictEqual(data.blacklist[2].pattern, 'c');
  });

  it('writes valid JSON', () => {
    writeConfig([]);
    addPattern(configPath, '**/*.pem', 'keys');
    JSON.parse(fs.readFileSync(configPath, 'utf8'));
  });

});
