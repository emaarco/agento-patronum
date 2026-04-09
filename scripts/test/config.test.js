'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const { strictEqual, deepStrictEqual, ok } = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { validateConfig, loadEntries, loadAllEntries } = require('../lib/config');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'patronum-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('validateConfig', () => {
  it('returns true for valid JSON', () => {
    const f = path.join(tmpDir, 'valid.json');
    fs.writeFileSync(f, '{"entries":[]}');
    strictEqual(validateConfig(f), true);
  });

  it('returns false for invalid JSON', () => {
    const f = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(f, '{broken');
    strictEqual(validateConfig(f), false);
  });

  it('returns false for missing file', () => {
    strictEqual(validateConfig(path.join(tmpDir, 'nope.json')), false);
  });
});

describe('loadEntries', () => {
  it('returns entries from valid config', () => {
    const f = path.join(tmpDir, 'cfg.json');
    const entries = [{ pattern: '**/.env', reason: 'test' }];
    fs.writeFileSync(f, JSON.stringify({ entries }));
    deepStrictEqual(loadEntries(f), entries);
  });

  it('returns [] on missing file', () => {
    deepStrictEqual(loadEntries(path.join(tmpDir, 'nope.json')), []);
  });

  it('returns [] when entries key is absent', () => {
    const f = path.join(tmpDir, 'empty.json');
    fs.writeFileSync(f, '{}');
    deepStrictEqual(loadEntries(f), []);
  });

  it('returns [] on invalid JSON', () => {
    const f = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(f, '{broken');
    deepStrictEqual(loadEntries(f), []);
  });
});

describe('loadAllEntries', () => {
  it('merges entries from user + project configs', () => {
    const userCfg = path.join(tmpDir, 'user.json');
    const projCfg = path.join(tmpDir, 'proj.json');
    fs.writeFileSync(userCfg, JSON.stringify({ entries: [{ pattern: 'a' }] }));
    fs.writeFileSync(projCfg, JSON.stringify({ entries: [{ pattern: 'b' }] }));

    const config = {
      userConfig: userCfg,
      projConfig: projCfg,
      localRepoConfig: '',
    };
    const result = loadAllEntries(config);
    strictEqual(result.length, 2);
    strictEqual(result[0].pattern, 'a');
    strictEqual(result[1].pattern, 'b');
  });

  it('skips missing configs gracefully', () => {
    const userCfg = path.join(tmpDir, 'user.json');
    fs.writeFileSync(userCfg, JSON.stringify({ entries: [{ pattern: 'x' }] }));

    const config = {
      userConfig: userCfg,
      projConfig: path.join(tmpDir, 'nope.json'),
      localRepoConfig: '',
    };
    const result = loadAllEntries(config);
    strictEqual(result.length, 1);
  });

  it('returns [] when no configs exist', () => {
    const config = {
      userConfig: path.join(tmpDir, 'nope1.json'),
      projConfig: '',
      localRepoConfig: '',
    };
    deepStrictEqual(loadAllEntries(config), []);
  });
});
