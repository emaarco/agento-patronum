'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const { strictEqual, deepStrictEqual, ok } = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { validateConfig, loadEntries, loadAllEntries, requireHome, getActiveConfigs, validateActiveConfigs } = require('./config');

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
  it('returns blacklist and whitelist from v2 config', () => {
    const f = path.join(tmpDir, 'cfg.json');
    const blacklist = [{ pattern: '**/.env', reason: 'test' }];
    const whitelist = [{ pattern: '**/.env.example', reason: 'safe' }];
    fs.writeFileSync(f, JSON.stringify({ blacklist, whitelist }));
    const result = loadEntries(f);
    deepStrictEqual(result.blacklist, blacklist);
    deepStrictEqual(result.whitelist, whitelist);
  });

  it('returns empty lists on missing file', () => {
    const result = loadEntries(path.join(tmpDir, 'nope.json'));
    deepStrictEqual(result.blacklist, []);
    deepStrictEqual(result.whitelist, []);
  });

  it('returns empty lists when keys are absent', () => {
    const f = path.join(tmpDir, 'empty.json');
    fs.writeFileSync(f, '{}');
    const result = loadEntries(f);
    deepStrictEqual(result.blacklist, []);
    deepStrictEqual(result.whitelist, []);
  });

  it('returns empty lists on invalid JSON', () => {
    const f = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(f, '{broken');
    const result = loadEntries(f);
    deepStrictEqual(result.blacklist, []);
    deepStrictEqual(result.whitelist, []);
  });
});

describe('loadAllEntries', () => {
  it('merges blacklists from user + project configs', () => {
    const userCfg = path.join(tmpDir, 'user.json');
    const projCfg = path.join(tmpDir, 'proj.json');
    fs.writeFileSync(userCfg, JSON.stringify({ blacklist: [{ pattern: 'a' }], whitelist: [] }));
    fs.writeFileSync(projCfg, JSON.stringify({ blacklist: [{ pattern: 'b' }], whitelist: [] }));

    const config = { userConfig: userCfg, projConfig: projCfg, localRepoConfig: '' };
    const { blacklist } = loadAllEntries(config);
    strictEqual(blacklist.length, 2);
    strictEqual(blacklist[0].pattern, 'a');
    strictEqual(blacklist[1].pattern, 'b');
  });

  it('merges whitelists from multiple configs', () => {
    const userCfg = path.join(tmpDir, 'user.json');
    const projCfg = path.join(tmpDir, 'proj.json');
    fs.writeFileSync(userCfg, JSON.stringify({ blacklist: [], whitelist: [{ pattern: 'w1' }] }));
    fs.writeFileSync(projCfg, JSON.stringify({ blacklist: [], whitelist: [{ pattern: 'w2' }] }));

    const config = { userConfig: userCfg, projConfig: projCfg, localRepoConfig: '' };
    const { whitelist } = loadAllEntries(config);
    strictEqual(whitelist.length, 2);
    strictEqual(whitelist[0].pattern, 'w1');
    strictEqual(whitelist[1].pattern, 'w2');
  });

  it('skips missing configs gracefully', () => {
    const userCfg = path.join(tmpDir, 'user.json');
    fs.writeFileSync(userCfg, JSON.stringify({ blacklist: [{ pattern: 'x' }], whitelist: [] }));

    const config = { userConfig: userCfg, projConfig: path.join(tmpDir, 'nope.json'), localRepoConfig: '' };
    const { blacklist } = loadAllEntries(config);
    strictEqual(blacklist.length, 1);
  });

  it('returns empty lists when no configs exist', () => {
    const config = { userConfig: path.join(tmpDir, 'nope1.json'), projConfig: '', localRepoConfig: '' };
    const { blacklist, whitelist } = loadAllEntries(config);
    deepStrictEqual(blacklist, []);
    deepStrictEqual(whitelist, []);
  });
});

describe('requireHome', () => {
  it('exits 2 when HOME is unset', () => {
    const origHome = process.env.HOME;
    const origExit = process.exit;
    let exitCode;
    process.exit = (code) => { exitCode = code; throw new Error('exit'); };
    delete process.env.HOME;
    try {
      requireHome();
    } catch {
      // expected
    }
    process.env.HOME = origHome;
    process.exit = origExit;
    strictEqual(exitCode, 2);
  });

  it('does nothing when HOME is set', () => {
    requireHome(); // should not throw
  });
});

describe('getActiveConfigs', () => {
  it('returns only configs that exist on disk', () => {
    const existing = path.join(tmpDir, 'exists.json');
    fs.writeFileSync(existing, '{}');
    const config = {
      userConfig: existing,
      projConfig: path.join(tmpDir, 'nope.json'),
      localRepoConfig: '',
    };
    const result = getActiveConfigs(config);
    strictEqual(result.length, 1);
    strictEqual(result[0], existing);
  });

  it('returns empty when no configs exist', () => {
    const config = {
      userConfig: path.join(tmpDir, 'nope.json'),
      projConfig: '',
      localRepoConfig: '',
    };
    deepStrictEqual(getActiveConfigs(config), []);
  });
});

describe('validateActiveConfigs', () => {
  it('passes for valid configs', () => {
    const f = path.join(tmpDir, 'valid.json');
    fs.writeFileSync(f, '{"blacklist":[],"whitelist":[]}');
    validateActiveConfigs([f]); // should not throw
  });

  it('exits 2 for invalid config', () => {
    const f = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(f, '{broken');
    const origExit = process.exit;
    let exitCode;
    process.exit = (code) => { exitCode = code; throw new Error('exit'); };
    try {
      validateActiveConfigs([f]);
    } catch {
      // expected
    }
    process.exit = origExit;
    strictEqual(exitCode, 2);
  });

  it('exits 0 for invalid config with failOpen', () => {
    const f = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(f, '{broken');
    const origExit = process.exit;
    let exitCode;
    process.exit = (code) => { exitCode = code; throw new Error('exit'); };
    try {
      validateActiveConfigs([f], { failOpen: true });
    } catch {
      // expected
    }
    process.exit = origExit;
    strictEqual(exitCode, 0);
  });
});
