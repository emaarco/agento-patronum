'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const { strictEqual } = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { removePattern } = require('./patronum-remove');

let tmpDir;
let configPath;

function writeConfig(blacklist, whitelist = []) {
  fs.writeFileSync(configPath, JSON.stringify({ blacklist, whitelist }, null, 2) + '\n');
}

function readConfig() {
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'patronum-remove-test-'));
  configPath = path.join(tmpDir, 'patronum.json');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('removePattern', () => {
  it('removes an existing pattern from blacklist', () => {
    writeConfig([{ pattern: '**/.env' }, { pattern: '**/*.pem' }]);
    const result = removePattern(configPath, '**/.env');
    strictEqual(result.removed, true);
    strictEqual(result.fromList, 'blacklist');
    strictEqual(result.remaining, 1);

    const data = readConfig();
    strictEqual(data.blacklist[0].pattern, '**/*.pem');
  });

  it('removes an existing pattern from whitelist', () => {
    writeConfig([], [{ pattern: '**/.env.example' }, { pattern: '**/.env.test' }]);
    const result = removePattern(configPath, '**/.env.example');
    strictEqual(result.removed, true);
    strictEqual(result.fromList, 'whitelist');
    strictEqual(result.remaining, 1);

    const data = readConfig();
    strictEqual(data.whitelist[0].pattern, '**/.env.test');
  });

  it('returns not-found for missing pattern', () => {
    writeConfig([{ pattern: '**/.env' }]);
    const result = removePattern(configPath, 'nope');
    strictEqual(result.removed, false);
    strictEqual(result.remaining, 1);

    const data = readConfig();
    strictEqual(data.blacklist.length, 1);
  });

  it('preserves remaining entries', () => {
    writeConfig([{ pattern: 'a' }, { pattern: 'b' }, { pattern: 'c' }]);
    removePattern(configPath, 'b');

    const data = readConfig();
    strictEqual(data.blacklist.length, 2);
    strictEqual(data.blacklist[0].pattern, 'a');
    strictEqual(data.blacklist[1].pattern, 'c');
  });

  it('writes valid JSON after removal', () => {
    writeConfig([{ pattern: '**/.env' }]);
    removePattern(configPath, '**/.env');
    JSON.parse(fs.readFileSync(configPath, 'utf8'));
  });

});
