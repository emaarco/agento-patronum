'use strict';

const { describe, it } = require('node:test');
const { strictEqual } = require('node:assert');
const { enforceBash, enforceBashFiles } = require('../patronum-bash-hook');

const ENTRIES = [
  { pattern: '**/.env', reason: 'secrets' },
  { pattern: '**/.env.*', reason: 'env overrides' },
  { pattern: '~/.ssh/*', reason: 'ssh keys' },
  { pattern: 'Bash(printenv)', reason: 'env dump' },
];

const HOME = '/home/testuser';

describe('enforceBash', () => {
  it('blocks exact match', () => {
    const r = enforceBash(
      { tool_input: { command: 'printenv' } },
      ENTRIES,
    );
    strictEqual(r.blocked, true);
    strictEqual(r.pattern, 'Bash(printenv)');
  });

  it('blocks prefix match with arguments', () => {
    const r = enforceBash(
      { tool_input: { command: 'printenv HOME' } },
      ENTRIES,
    );
    strictEqual(r.blocked, true);
  });

  it('allows safe command', () => {
    const r = enforceBash(
      { tool_input: { command: 'ls -la' } },
      ENTRIES,
    );
    strictEqual(r.blocked, false);
  });

  it('allows set with options', () => {
    const r = enforceBash(
      { tool_input: { command: 'set -euo pipefail' } },
      ENTRIES,
    );
    strictEqual(r.blocked, false);
  });

  it('allows env with variable assignment', () => {
    const r = enforceBash(
      { tool_input: { command: 'env NODE_ENV=test npm run build' } },
      ENTRIES,
    );
    strictEqual(r.blocked, false);
  });

  it('no false positive for protected filename in body text', () => {
    const r = enforceBash(
      { tool_input: { command: 'gh issue create --body "see .env.local for details"' } },
      ENTRIES,
    );
    strictEqual(r.blocked, false);
  });

  it('allows when no command', () => {
    const r = enforceBash({ tool_input: {} }, ENTRIES);
    strictEqual(r.blocked, false);
  });

  it('skips file patterns (command matching only)', () => {
    const r = enforceBash(
      { tool_input: { command: 'cat .env' } },
      [{ pattern: '**/.env' }],
    );
    strictEqual(r.blocked, false);
  });

  it('allows with empty entries', () => {
    const r = enforceBash(
      { tool_input: { command: 'printenv' } },
      [],
    );
    strictEqual(r.blocked, false);
  });

  it('does not match partial command name', () => {
    const r = enforceBash(
      { tool_input: { command: 'printenvs' } },
      ENTRIES,
    );
    strictEqual(r.blocked, false);
  });

  it('blocks command followed by pipe operator', () => {
    const r = enforceBash(
      { tool_input: { command: 'printenv|grep SECRET' } },
      ENTRIES,
    );
    strictEqual(r.blocked, true);
  });

  it('blocks command followed by semicolon', () => {
    const r = enforceBash(
      { tool_input: { command: 'printenv;cat file' } },
      ENTRIES,
    );
    strictEqual(r.blocked, true);
  });

  it('blocks command followed by &&', () => {
    const r = enforceBash(
      { tool_input: { command: 'printenv&&ls' } },
      ENTRIES,
    );
    strictEqual(r.blocked, true);
  });

  it('blocks command followed by redirect', () => {
    const r = enforceBash(
      { tool_input: { command: 'printenv>out.txt' } },
      ENTRIES,
    );
    strictEqual(r.blocked, true);
  });

  it('respects match: exact — blocks bare command', () => {
    const entries = [{ pattern: 'Bash(env)', reason: 'env dump', match: 'exact' }];
    const r = enforceBash({ tool_input: { command: 'env' } }, entries);
    strictEqual(r.blocked, true);
  });

  it('respects match: exact — allows command with arguments', () => {
    const entries = [{ pattern: 'Bash(env)', reason: 'env dump', match: 'exact' }];
    const r = enforceBash({ tool_input: { command: 'env NODE_ENV=test npm start' } }, entries);
    strictEqual(r.blocked, false);
  });

  it('respects match: exact for set', () => {
    const entries = [{ pattern: 'Bash(set)', reason: 'var dump', match: 'exact' }];
    strictEqual(enforceBash({ tool_input: { command: 'set' } }, entries).blocked, true);
    strictEqual(enforceBash({ tool_input: { command: 'set -euo pipefail' } }, entries).blocked, false);
  });
});

describe('enforceBashFiles', () => {
  it('blocks cat .env', () => {
    const r = enforceBashFiles(
      { tool_input: { command: 'cat .env' } },
      ENTRIES, HOME,
    );
    strictEqual(r.blocked, true);
    strictEqual(r.pattern, '**/.env');
  });

  it('blocks cat .env.local', () => {
    const r = enforceBashFiles(
      { tool_input: { command: 'cat .env.local' } },
      ENTRIES, HOME,
    );
    strictEqual(r.blocked, true);
  });

  it('blocks absolute path to ssh key', () => {
    const r = enforceBashFiles(
      { tool_input: { command: 'cat /home/testuser/.ssh/id_rsa' } },
      ENTRIES, HOME,
    );
    strictEqual(r.blocked, true);
    strictEqual(r.pattern, '~/.ssh/*');
  });

  it('blocks tilde path in command', () => {
    const r = enforceBashFiles(
      { tool_input: { command: 'cat ~/.ssh/id_rsa' } },
      ENTRIES, HOME,
    );
    strictEqual(r.blocked, true);
  });

  it('allows safe file in command', () => {
    const r = enforceBashFiles(
      { tool_input: { command: 'cat /tmp/safe.txt' } },
      ENTRIES, HOME,
    );
    strictEqual(r.blocked, false);
  });

  it('allows when no command', () => {
    const r = enforceBashFiles({ tool_input: {} }, ENTRIES, HOME);
    strictEqual(r.blocked, false);
  });

  it('allows when no file entries', () => {
    const r = enforceBashFiles(
      { tool_input: { command: 'cat .env' } },
      [{ pattern: 'Bash(printenv)' }],
      HOME,
    );
    strictEqual(r.blocked, false);
  });

  it('does not false-positive on .env in quoted body text', () => {
    const r = enforceBashFiles(
      { tool_input: { command: 'gh issue create --body "see .env.local for details"' } },
      ENTRIES, HOME,
    );
    strictEqual(r.blocked, false);
  });

  it('blocks grep targeting .env', () => {
    const r = enforceBashFiles(
      { tool_input: { command: 'grep SECRET .env.local' } },
      ENTRIES, HOME,
    );
    strictEqual(r.blocked, true);
  });
});
