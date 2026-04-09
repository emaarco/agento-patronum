'use strict';

const { describe, it } = require('node:test');
const { strictEqual } = require('node:assert');
const { globTest, matchGlob } = require('../lib/matching');

describe('globTest', () => {
  it('matches exact string', () => {
    strictEqual(globTest('/etc/passwd', '/etc/passwd'), true);
  });

  it('rejects non-matching string', () => {
    strictEqual(globTest('/etc/passwd', '/etc/shadow'), false);
  });

  it('* matches across directories', () => {
    strictEqual(globTest('/home/user/.ssh/id_rsa', '/home/*'), true);
  });

  it('* matches single segment', () => {
    strictEqual(globTest('file.pem', '*.pem'), true);
  });

  it('? matches single character', () => {
    strictEqual(globTest('.env', '.en?'), true);
    strictEqual(globTest('.envv', '.en?'), false);
  });

  it('escapes regex special characters in pattern', () => {
    strictEqual(globTest('.env.local', '.env.local'), true);
    strictEqual(globTest('.envXlocal', '.env.local'), false);
  });

  it('anchors match to full string', () => {
    strictEqual(globTest('/project/.env.backup', '.env'), false);
    strictEqual(globTest('.env', '.env'), true);
  });
});

describe('matchGlob', () => {
  const home = '/home/testuser';

  it('matches tilde-prefixed patterns', () => {
    strictEqual(matchGlob('/home/testuser/.ssh/id_rsa', '~/.ssh/*', home), true);
  });

  it('expands tilde in file path', () => {
    strictEqual(matchGlob('~/.ssh/id_rsa', '~/.ssh/*', home), true);
  });

  it('matches **/ deep glob patterns', () => {
    strictEqual(matchGlob('/project/dir/.env', '**/.env', home), true);
    strictEqual(matchGlob('/deeply/nested/path/.env', '**/.env', home), true);
  });

  it('matches **/*.ext patterns via basename fallback', () => {
    strictEqual(matchGlob('/etc/ssl/server.pem', '**/*.pem', home), true);
    strictEqual(matchGlob('server.pem', '**/*.pem', home), true);
  });

  it('does not match unrelated files with deep glob', () => {
    strictEqual(matchGlob('/project/.env.bak', '**/.env', home), false);
  });

  it('matches exact absolute paths', () => {
    strictEqual(matchGlob('/home/testuser/.aws/credentials', '~/.aws/credentials', home), true);
  });

  it('allows safe files that match no patterns', () => {
    strictEqual(matchGlob('/tmp/safe.txt', '~/.ssh/*', home), false);
    strictEqual(matchGlob('/tmp/safe.txt', '**/.env', home), false);
  });

  it('handles .env.* patterns', () => {
    strictEqual(matchGlob('/project/.env.local', '**/.env.*', home), true);
    strictEqual(matchGlob('/project/.env.production', '**/.env.*', home), true);
    strictEqual(matchGlob('/project/.env', '**/.env.*', home), false);
  });

  it('handles patterns without wildcards', () => {
    strictEqual(matchGlob('/home/testuser/.npmrc', '~/.npmrc', home), true);
    strictEqual(matchGlob('/home/testuser/.pypirc', '~/.npmrc', home), false);
  });
});
