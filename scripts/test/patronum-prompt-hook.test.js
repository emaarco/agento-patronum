'use strict';

const { describe, it } = require('node:test');
const { strictEqual } = require('node:assert');
const { enforcePrompt } = require('../patronum-prompt-hook');

const HOME = '/home/testuser';
const CWD = '/project';

const ENTRIES = [
  { pattern: '**/.env', reason: 'secrets' },
  { pattern: '**/.env.*', reason: 'env overrides' },
  { pattern: '**/*.pem', reason: 'private keys' },
  { pattern: '~/.ssh/*', reason: 'ssh keys' },
  { pattern: 'Bash(printenv)', reason: 'env dump' },
];

describe('enforcePrompt', () => {
  it('blocks @mention to .env.local', () => {
    const r = enforcePrompt(
      { prompt: 'whats in @stack/.env.local' },
      ENTRIES, HOME, CWD,
    );
    strictEqual(r.blocked, true);
    strictEqual(r.pattern, '**/.env.*');
  });

  it('blocks @mention to .env', () => {
    const r = enforcePrompt(
      { prompt: 'show me @project/.env' },
      ENTRIES, HOME, CWD,
    );
    strictEqual(r.blocked, true);
  });

  it('blocks @mention to ~/.ssh/id_rsa', () => {
    const r = enforcePrompt(
      { prompt: 'read @~/.ssh/id_rsa' },
      ENTRIES, HOME, CWD,
    );
    strictEqual(r.blocked, true);
  });

  it('allows @mention to safe file', () => {
    const r = enforcePrompt(
      { prompt: 'check @README.md' },
      ENTRIES, HOME, CWD,
    );
    strictEqual(r.blocked, false);
  });

  it('allows prompt with no @mentions', () => {
    const r = enforcePrompt(
      { prompt: 'what is 2+2' },
      ENTRIES, HOME, CWD,
    );
    strictEqual(r.blocked, false);
  });

  it('allows empty prompt', () => {
    const r = enforcePrompt({ prompt: '' }, ENTRIES, HOME, CWD);
    strictEqual(r.blocked, false);
  });

  it('allows when no prompt field', () => {
    const r = enforcePrompt({}, ENTRIES, HOME, CWD);
    strictEqual(r.blocked, false);
  });

  it('resolves relative paths against cwd', () => {
    const r = enforcePrompt(
      { prompt: 'check @.env' },
      ENTRIES, HOME, CWD,
    );
    strictEqual(r.blocked, true);
  });

  it('resolves absolute @mention paths', () => {
    const r = enforcePrompt(
      { prompt: 'read @/etc/ssl/cert.pem' },
      ENTRIES, HOME, CWD,
    );
    strictEqual(r.blocked, true);
  });

  it('skips Bash() patterns', () => {
    const r = enforcePrompt(
      { prompt: 'check @README.md' },
      [{ pattern: 'Bash(printenv)' }],
      HOME, CWD,
    );
    strictEqual(r.blocked, false);
  });
});
