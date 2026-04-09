'use strict';

const { describe, it } = require('node:test');
const { strictEqual } = require('node:assert');
const { enforceBash } = require('../lib/enforce-bash');

const ENTRIES = [
  { pattern: '**/.env', reason: 'secrets' },
  { pattern: 'Bash(printenv)', reason: 'env dump' },
];

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
