'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const { strictEqual, ok } = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { addPattern } = require('./patronum-add');

let tmpDir;
let configPath;

function writeConfig(entries) {
  fs.writeFileSync(configPath, JSON.stringify({ entries }, null, 2) + '\n');
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
  it('adds a new pattern', () => {
    writeConfig([]);
    const result = addPattern(configPath, '**/.env', 'secrets');
    strictEqual(result.added, true);
    strictEqual(result.total, 1);

    const data = readConfig();
    strictEqual(data.entries[0].pattern, '**/.env');
    strictEqual(data.entries[0].reason, 'secrets');
    strictEqual(data.entries[0].type, 'glob');
    strictEqual(data.entries[0].source, 'user');
    ok(data.entries[0].addedAt);
  });

  it('returns duplicate for existing pattern', () => {
    writeConfig([{ pattern: '**/.env', reason: 'existing' }]);
    const result = addPattern(configPath, '**/.env', 'new reason');
    strictEqual(result.added, false);
    strictEqual(result.reason, 'duplicate');

    const data = readConfig();
    strictEqual(data.entries.length, 1);
    strictEqual(data.entries[0].reason, 'existing');
  });

  it('preserves existing entries', () => {
    writeConfig([{ pattern: 'a' }, { pattern: 'b' }]);
    addPattern(configPath, 'c', '');

    const data = readConfig();
    strictEqual(data.entries.length, 3);
    strictEqual(data.entries[0].pattern, 'a');
    strictEqual(data.entries[1].pattern, 'b');
    strictEqual(data.entries[2].pattern, 'c');
  });

  it('writes valid JSON', () => {
    writeConfig([]);
    addPattern(configPath, '**/*.pem', 'keys');
    // Should not throw
    JSON.parse(fs.readFileSync(configPath, 'utf8'));
  });

  it('handles config with no entries key', () => {
    fs.writeFileSync(configPath, '{}');
    const result = addPattern(configPath, '**/.env', '');
    strictEqual(result.added, true);
    strictEqual(result.total, 1);
  });
});
