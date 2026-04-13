'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const { strictEqual } = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { removePattern } = require('./patronum-remove');

let tmpDir;
let configPath;

function writeConfig(entries) {
  fs.writeFileSync(configPath, JSON.stringify({ entries }, null, 2) + '\n');
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
  it('removes an existing pattern', () => {
    writeConfig([{ pattern: '**/.env' }, { pattern: '**/*.pem' }]);
    const result = removePattern(configPath, '**/.env');
    strictEqual(result.removed, true);
    strictEqual(result.remaining, 1);

    const data = readConfig();
    strictEqual(data.entries[0].pattern, '**/*.pem');
  });

  it('returns not-found for missing pattern', () => {
    writeConfig([{ pattern: '**/.env' }]);
    const result = removePattern(configPath, 'nope');
    strictEqual(result.removed, false);
    strictEqual(result.remaining, 1);

    // Config unchanged
    const data = readConfig();
    strictEqual(data.entries.length, 1);
  });

  it('preserves remaining entries', () => {
    writeConfig([{ pattern: 'a' }, { pattern: 'b' }, { pattern: 'c' }]);
    removePattern(configPath, 'b');

    const data = readConfig();
    strictEqual(data.entries.length, 2);
    strictEqual(data.entries[0].pattern, 'a');
    strictEqual(data.entries[1].pattern, 'c');
  });

  it('writes valid JSON after removal', () => {
    writeConfig([{ pattern: '**/.env' }]);
    removePattern(configPath, '**/.env');
    // Should not throw
    JSON.parse(fs.readFileSync(configPath, 'utf8'));
  });
});
