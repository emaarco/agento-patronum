'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const { strictEqual, ok } = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { logViolation } = require('../lib/logging');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'patronum-log-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('logViolation', () => {
  it('appends a newline-terminated JSON line', () => {
    const logFile = path.join(tmpDir, 'test.log');
    logViolation(logFile, { tool: 'Read', target: '/project/.env', pattern: '**/.env' });

    const content = fs.readFileSync(logFile, 'utf8');
    ok(content.endsWith('\n'));
    const parsed = JSON.parse(content.trim());
    strictEqual(parsed.tool, 'Read');
    strictEqual(parsed.target, '/project/.env');
    strictEqual(parsed.pattern, '**/.env');
    ok(parsed.ts);
  });

  it('appends multiple entries', () => {
    const logFile = path.join(tmpDir, 'test.log');
    logViolation(logFile, { tool: 'Read', target: 'a', pattern: 'p1' });
    logViolation(logFile, { tool: 'Bash', target: 'b', pattern: 'p2' });

    const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
    strictEqual(lines.length, 2);
  });

  it('does not throw on unwritable path', () => {
    // Should silently swallow the error
    logViolation('/nonexistent/dir/test.log', { tool: 'Read', target: 'x', pattern: 'y' });
  });
});
