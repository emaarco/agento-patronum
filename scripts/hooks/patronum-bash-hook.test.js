'use strict';

const { describe, it } = require('node:test');
const { strictEqual } = require('node:assert');
const { enforceBash, enforceBashFiles } = require('./patronum-bash-hook');

const BLACKLIST = [
  { pattern: '**/.env', reason: 'secrets' },
  { pattern: '**/.env.*', reason: 'env overrides' },
  { pattern: '~/.ssh/*', reason: 'ssh keys' },
  { pattern: 'Bash(printenv)', reason: 'env dump' },
];

const NO_WHITELIST = [];
const HOME = '/home/testuser';

describe('enforceBash', () => {
  it('blocks exact match', () => {
    const r = enforceBash(
      { tool_input: { command: 'printenv' } },
      BLACKLIST, NO_WHITELIST,
    );
    strictEqual(r.blocked, true);
    strictEqual(r.pattern, 'Bash(printenv)');
  });

  it('blocks prefix match with arguments', () => {
    const r = enforceBash(
      { tool_input: { command: 'printenv HOME' } },
      BLACKLIST, NO_WHITELIST,
    );
    strictEqual(r.blocked, true);
  });

  it('allows safe command', () => {
    const r = enforceBash(
      { tool_input: { command: 'ls -la' } },
      BLACKLIST, NO_WHITELIST,
    );
    strictEqual(r.blocked, false);
  });

  it('allows set with options', () => {
    const r = enforceBash(
      { tool_input: { command: 'set -euo pipefail' } },
      BLACKLIST, NO_WHITELIST,
    );
    strictEqual(r.blocked, false);
  });

  it('allows env with variable assignment', () => {
    const r = enforceBash(
      { tool_input: { command: 'env NODE_ENV=test npm run build' } },
      BLACKLIST, NO_WHITELIST,
    );
    strictEqual(r.blocked, false);
  });

  it('no false positive for protected filename in body text', () => {
    const r = enforceBash(
      { tool_input: { command: 'gh issue create --body "see .env.local for details"' } },
      BLACKLIST, NO_WHITELIST,
    );
    strictEqual(r.blocked, false);
  });

  it('allows when no command', () => {
    const r = enforceBash({ tool_input: {} }, BLACKLIST, NO_WHITELIST);
    strictEqual(r.blocked, false);
  });

  it('skips file patterns (command matching only)', () => {
    const r = enforceBash(
      { tool_input: { command: 'cat .env' } },
      [{ pattern: '**/.env' }], NO_WHITELIST,
    );
    strictEqual(r.blocked, false);
  });

  it('allows with empty entries', () => {
    const r = enforceBash(
      { tool_input: { command: 'printenv' } },
      [], NO_WHITELIST,
    );
    strictEqual(r.blocked, false);
  });

  it('does not match partial command name', () => {
    const r = enforceBash(
      { tool_input: { command: 'printenvs' } },
      BLACKLIST, NO_WHITELIST,
    );
    strictEqual(r.blocked, false);
  });

  it('blocks command followed by pipe operator', () => {
    const r = enforceBash(
      { tool_input: { command: 'printenv|grep SECRET' } },
      BLACKLIST, NO_WHITELIST,
    );
    strictEqual(r.blocked, true);
  });

  it('blocks command followed by semicolon', () => {
    const r = enforceBash(
      { tool_input: { command: 'printenv;cat file' } },
      BLACKLIST, NO_WHITELIST,
    );
    strictEqual(r.blocked, true);
  });

  it('blocks command followed by &&', () => {
    const r = enforceBash(
      { tool_input: { command: 'printenv&&ls' } },
      BLACKLIST, NO_WHITELIST,
    );
    strictEqual(r.blocked, true);
  });

  it('blocks command followed by redirect', () => {
    const r = enforceBash(
      { tool_input: { command: 'printenv>out.txt' } },
      BLACKLIST, NO_WHITELIST,
    );
    strictEqual(r.blocked, true);
  });

  it('respects match: exact — blocks bare command', () => {
    const blacklist = [{ pattern: 'Bash(env)', reason: 'env dump', match: 'exact' }];
    const r = enforceBash({ tool_input: { command: 'env' } }, blacklist, NO_WHITELIST);
    strictEqual(r.blocked, true);
  });

  it('respects match: exact — allows command with arguments', () => {
    const blacklist = [{ pattern: 'Bash(env)', reason: 'env dump', match: 'exact' }];
    const r = enforceBash({ tool_input: { command: 'env NODE_ENV=test npm start' } }, blacklist, NO_WHITELIST);
    strictEqual(r.blocked, false);
  });

  it('respects match: exact for set', () => {
    const blacklist = [{ pattern: 'Bash(set)', reason: 'var dump', match: 'exact' }];
    strictEqual(enforceBash({ tool_input: { command: 'set' } }, blacklist, NO_WHITELIST).blocked, true);
    strictEqual(enforceBash({ tool_input: { command: 'set -euo pipefail' } }, blacklist, NO_WHITELIST).blocked, false);
  });

  it('whitelist overrides blacklist for Bash command', () => {
    const blacklist = [{ pattern: 'Bash(printenv)', reason: 'blocked' }];
    const whitelist = [{ pattern: 'Bash(printenv)', reason: 'explicitly allowed' }];
    const r = enforceBash({ tool_input: { command: 'printenv' } }, blacklist, whitelist);
    strictEqual(r.blocked, false);
  });
});

describe('enforceBashFiles', () => {
  it('blocks cat .env', () => {
    const r = enforceBashFiles(
      { tool_input: { command: 'cat .env' } },
      BLACKLIST, NO_WHITELIST, HOME,
    );
    strictEqual(r.blocked, true);
    strictEqual(r.pattern, '**/.env');
  });

  it('blocks cat .env.local', () => {
    const r = enforceBashFiles(
      { tool_input: { command: 'cat .env.local' } },
      BLACKLIST, NO_WHITELIST, HOME,
    );
    strictEqual(r.blocked, true);
  });

  it('blocks absolute path to ssh key', () => {
    const r = enforceBashFiles(
      { tool_input: { command: 'cat /home/testuser/.ssh/id_rsa' } },
      BLACKLIST, NO_WHITELIST, HOME,
    );
    strictEqual(r.blocked, true);
    strictEqual(r.pattern, '~/.ssh/*');
  });

  it('blocks tilde path in command', () => {
    const r = enforceBashFiles(
      { tool_input: { command: 'cat ~/.ssh/id_rsa' } },
      BLACKLIST, NO_WHITELIST, HOME,
    );
    strictEqual(r.blocked, true);
  });

  it('allows safe file in command', () => {
    const r = enforceBashFiles(
      { tool_input: { command: 'cat /tmp/safe.txt' } },
      BLACKLIST, NO_WHITELIST, HOME,
    );
    strictEqual(r.blocked, false);
  });

  it('allows when no command', () => {
    const r = enforceBashFiles({ tool_input: {} }, BLACKLIST, NO_WHITELIST, HOME);
    strictEqual(r.blocked, false);
  });

  it('allows when no file entries', () => {
    const r = enforceBashFiles(
      { tool_input: { command: 'cat .env' } },
      [{ pattern: 'Bash(printenv)' }],
      NO_WHITELIST, HOME,
    );
    strictEqual(r.blocked, false);
  });

  it('does not false-positive on .env in quoted body text', () => {
    const r = enforceBashFiles(
      { tool_input: { command: 'gh issue create --body "see .env.local for details"' } },
      BLACKLIST, NO_WHITELIST, HOME,
    );
    strictEqual(r.blocked, false);
  });

  it('blocks grep targeting .env', () => {
    const r = enforceBashFiles(
      { tool_input: { command: 'grep SECRET .env.local' } },
      BLACKLIST, NO_WHITELIST, HOME,
    );
    strictEqual(r.blocked, true);
  });

  it('whitelist overrides blacklist for file token in command', () => {
    const blacklist = [{ pattern: '**/.env', reason: 'blocked' }];
    const whitelist = [{ pattern: '**/.env', reason: 'explicitly allowed' }];
    const r = enforceBashFiles(
      { tool_input: { command: 'cat .env' } },
      blacklist, whitelist, HOME,
    );
    strictEqual(r.blocked, false);
  });
});
