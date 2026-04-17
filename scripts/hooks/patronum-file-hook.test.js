'use strict';

const { describe, it } = require('node:test');
const { strictEqual } = require('node:assert');
const { enforceFile } = require('./patronum-file-hook');

const HOME = '/home/testuser';

const BLACKLIST = [
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

const NO_WHITELIST = [];

describe('enforceFile', () => {
  describe('Read tool', () => {
    it('blocks .env', () => {
      const r = enforceFile(
        { tool_name: 'Read', tool_input: { file_path: '/project/.env' } },
        BLACKLIST, NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, true);
      strictEqual(r.pattern, '**/.env');
    });

    it('blocks .env.local', () => {
      const r = enforceFile(
        { tool_name: 'Read', tool_input: { file_path: '/project/.env.local' } },
        BLACKLIST, NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, true);
      strictEqual(r.pattern, '**/.env.*');
    });

    it('blocks ~/.ssh/id_rsa', () => {
      const r = enforceFile(
        { tool_name: 'Read', tool_input: { file_path: `${HOME}/.ssh/id_rsa` } },
        BLACKLIST, NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, true);
      strictEqual(r.pattern, '~/.ssh/*');
    });

    it('blocks ~/.aws/credentials', () => {
      const r = enforceFile(
        { tool_name: 'Read', tool_input: { file_path: `${HOME}/.aws/credentials` } },
        BLACKLIST, NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, true);
    });

    it('blocks .pem files', () => {
      const r = enforceFile(
        { tool_name: 'Read', tool_input: { file_path: '/etc/ssl/server.pem' } },
        BLACKLIST, NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, true);
      strictEqual(r.pattern, '**/*.pem');
    });

    it('allows safe file', () => {
      const r = enforceFile(
        { tool_name: 'Read', tool_input: { file_path: '/tmp/safe.txt' } },
        BLACKLIST, NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, false);
    });

    it('allows when no file_path', () => {
      const r = enforceFile(
        { tool_name: 'Read', tool_input: {} },
        BLACKLIST, NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, false);
    });

    it('whitelist overrides blacklist', () => {
      const blacklist = [{ pattern: '**/.env', reason: 'blocked' }];
      const whitelist = [{ pattern: '**/.env', reason: 'explicitly allowed' }];
      const r = enforceFile(
        { tool_name: 'Read', tool_input: { file_path: '/project/.env' } },
        blacklist, whitelist, HOME,
      );
      strictEqual(r.blocked, false);
    });
  });

  describe('Write tool', () => {
    it('blocks .env.local', () => {
      const r = enforceFile(
        { tool_name: 'Write', tool_input: { file_path: '/project/.env.local' } },
        BLACKLIST, NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, true);
    });
  });

  describe('Edit tool', () => {
    it('blocks .env', () => {
      const r = enforceFile(
        { tool_name: 'Edit', tool_input: { file_path: '/project/.env' } },
        BLACKLIST, NO_WHITELIST, HOME,
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
        BLACKLIST, NO_WHITELIST, HOME,
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
        BLACKLIST, NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, false);
    });
  });

  describe('Glob tool', () => {
    it('blocks when path targets file inside protected directory', () => {
      const r = enforceFile(
        { tool_name: 'Glob', tool_input: { pattern: '*', path: `${HOME}/.ssh/config` } },
        BLACKLIST, NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, true);
      strictEqual(r.pattern, '~/.ssh/*');
    });

    it('blocks when pattern would enumerate .env files', () => {
      const r = enforceFile(
        { tool_name: 'Glob', tool_input: { pattern: '**/.env*' } },
        BLACKLIST, NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, true);
    });

    it('blocks when pattern matches .env exactly', () => {
      const r = enforceFile(
        { tool_name: 'Glob', tool_input: { pattern: '**/.env' } },
        BLACKLIST, NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, true);
    });

    it('blocks when pattern would find .pem files', () => {
      const r = enforceFile(
        { tool_name: 'Glob', tool_input: { pattern: '**/*.pem' } },
        BLACKLIST, NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, true);
    });

    it('allows safe glob pattern', () => {
      const r = enforceFile(
        { tool_name: 'Glob', tool_input: { pattern: '**/*.js', path: '/project' } },
        BLACKLIST, NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, false);
    });

    it('allows when no pattern', () => {
      const r = enforceFile(
        { tool_name: 'Glob', tool_input: {} },
        BLACKLIST, NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, false);
    });
  });

  describe('Grep tool', () => {
    it('blocks when path targets .env', () => {
      const r = enforceFile(
        { tool_name: 'Grep', tool_input: { pattern: 'SECRET', path: '/project/.env' } },
        BLACKLIST, NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, true);
      strictEqual(r.pattern, '**/.env');
    });

    it('blocks when path targets .pem file', () => {
      const r = enforceFile(
        { tool_name: 'Grep', tool_input: { pattern: 'key', path: '/etc/ssl/server.pem' } },
        BLACKLIST, NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, true);
    });

    it('allows safe path', () => {
      const r = enforceFile(
        { tool_name: 'Grep', tool_input: { pattern: 'TODO', path: '/project/src' } },
        BLACKLIST, NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, false);
    });
  });

  describe('edge cases', () => {
    it('allows when no tool_name', () => {
      const r = enforceFile({}, BLACKLIST, NO_WHITELIST, HOME);
      strictEqual(r.blocked, false);
    });

    it('allows unknown tool names', () => {
      const r = enforceFile(
        { tool_name: 'FooTool', tool_input: { file_path: '/project/.env' } },
        BLACKLIST, NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, false);
    });

    it('skips Bash() patterns', () => {
      const r = enforceFile(
        { tool_name: 'Read', tool_input: { file_path: '/tmp/safe.txt' } },
        [{ pattern: 'Bash(printenv)' }],
        NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, false);
    });

    it('allows with empty entries', () => {
      const r = enforceFile(
        { tool_name: 'Read', tool_input: { file_path: '/project/.env' } },
        [], NO_WHITELIST, HOME,
      );
      strictEqual(r.blocked, false);
    });
  });
});
