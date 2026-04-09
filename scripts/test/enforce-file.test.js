'use strict';

const { describe, it } = require('node:test');
const { strictEqual } = require('node:assert');
const { enforceFile } = require('../lib/enforce-file');

const HOME = '/home/testuser';

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
