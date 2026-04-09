'use strict';

const { describe, it } = require('node:test');
const { strictEqual } = require('node:assert');
const { enforceFile, enforceBash, enforcePrompt } = require('../lib/enforce');

const HOME = '/home/testuser';
const CWD = '/project';

const ENTRIES = [
  { pattern: '**/.env', reason: 'secrets' },
  { pattern: '**/.env.*', reason: 'env overrides' },
  { pattern: '**/*.pem', reason: 'private keys' },
  { pattern: '**/*.key', reason: 'key files' },
  { pattern: '~/.ssh/*', reason: 'ssh keys' },
  { pattern: '~/.aws/credentials', reason: 'aws creds' },
  { pattern: '~/.docker/config.json', reason: 'docker auth' },
  { pattern: '~/.npmrc', reason: 'npm tokens' },
  { pattern: 'Bash(printenv)', reason: 'env dump' },
];

// ── enforceFile ─────────────────────────────────────────────────────────────

describe('enforceFile', () => {
  describe('Read tool', () => {
    it('blocks .env', () => {
      const r = enforceFile(
        { tool_name: 'Read', tool_input: { file_path: '/project/.env' } },
        ENTRIES, HOME,
      );
      strictEqual(r.blocked, true);
      strictEqual(r.pattern, '**/.env');
    });

    it('blocks .env.local', () => {
      const r = enforceFile(
        { tool_name: 'Read', tool_input: { file_path: '/project/.env.local' } },
        ENTRIES, HOME,
      );
      strictEqual(r.blocked, true);
      strictEqual(r.pattern, '**/.env.*');
    });

    it('blocks ~/.ssh/id_rsa', () => {
      const r = enforceFile(
        { tool_name: 'Read', tool_input: { file_path: `${HOME}/.ssh/id_rsa` } },
        ENTRIES, HOME,
      );
      strictEqual(r.blocked, true);
      strictEqual(r.pattern, '~/.ssh/*');
    });

    it('blocks ~/.aws/credentials', () => {
      const r = enforceFile(
        { tool_name: 'Read', tool_input: { file_path: `${HOME}/.aws/credentials` } },
        ENTRIES, HOME,
      );
      strictEqual(r.blocked, true);
    });

    it('blocks .pem files', () => {
      const r = enforceFile(
        { tool_name: 'Read', tool_input: { file_path: '/etc/ssl/server.pem' } },
        ENTRIES, HOME,
      );
      strictEqual(r.blocked, true);
      strictEqual(r.pattern, '**/*.pem');
    });

    it('allows safe file', () => {
      const r = enforceFile(
        { tool_name: 'Read', tool_input: { file_path: '/tmp/safe.txt' } },
        ENTRIES, HOME,
      );
      strictEqual(r.blocked, false);
    });

    it('allows when no file_path', () => {
      const r = enforceFile(
        { tool_name: 'Read', tool_input: {} },
        ENTRIES, HOME,
      );
      strictEqual(r.blocked, false);
    });
  });

  describe('Write tool', () => {
    it('blocks .env.local', () => {
      const r = enforceFile(
        { tool_name: 'Write', tool_input: { file_path: '/project/.env.local' } },
        ENTRIES, HOME,
      );
      strictEqual(r.blocked, true);
    });
  });

  describe('Edit tool', () => {
    it('blocks .env', () => {
      const r = enforceFile(
        { tool_name: 'Edit', tool_input: { file_path: '/project/.env' } },
        ENTRIES, HOME,
      );
      strictEqual(r.blocked, true);
    });
  });

  describe('MultiEdit tool', () => {
    it('blocks when any edit targets protected file', () => {
      const r = enforceFile(
        {
          tool_name: 'MultiEdit',
          tool_input: {
            edits: [
              { file_path: '/tmp/safe.txt', old_string: 'x', new_string: 'y' },
              { file_path: '/project/.env', old_string: 'a', new_string: 'b' },
            ],
          },
        },
        ENTRIES, HOME,
      );
      strictEqual(r.blocked, true);
      strictEqual(r.target, '/project/.env');
    });

    it('allows when all edits target safe files', () => {
      const r = enforceFile(
        {
          tool_name: 'MultiEdit',
          tool_input: {
            edits: [{ file_path: '/tmp/safe.txt', old_string: 'x', new_string: 'y' }],
          },
        },
        ENTRIES, HOME,
      );
      strictEqual(r.blocked, false);
    });
  });

  describe('edge cases', () => {
    it('allows when no tool_name', () => {
      const r = enforceFile({}, ENTRIES, HOME);
      strictEqual(r.blocked, false);
    });

    it('allows unknown tool names', () => {
      const r = enforceFile(
        { tool_name: 'Glob', tool_input: { file_path: '/project/.env' } },
        ENTRIES, HOME,
      );
      strictEqual(r.blocked, false);
    });

    it('skips Bash() patterns', () => {
      const r = enforceFile(
        { tool_name: 'Read', tool_input: { file_path: '/tmp/safe.txt' } },
        [{ pattern: 'Bash(printenv)' }],
        HOME,
      );
      strictEqual(r.blocked, false);
    });

    it('allows with empty entries', () => {
      const r = enforceFile(
        { tool_name: 'Read', tool_input: { file_path: '/project/.env' } },
        [], HOME,
      );
      strictEqual(r.blocked, false);
    });
  });
});

// ── enforceBash ─────────────────────────────────────────────────────────────

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

  it('skips file patterns', () => {
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
});

// ── enforcePrompt ───────────────────────────────────────────────────────────

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
