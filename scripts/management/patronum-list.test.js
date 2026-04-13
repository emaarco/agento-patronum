'use strict';

const { describe, it } = require('node:test');
const { strictEqual, ok } = require('node:assert');
const { formatEntries } = require('./patronum-list');

describe('formatEntries', () => {
  it('returns empty array for no entries', () => {
    const lines = formatEntries([]);
    strictEqual(lines.length, 0);
  });

  it('returns header + data rows', () => {
    const entries = [
      { pattern: '**/.env', source: 'default', reason: 'secrets' },
    ];
    const lines = formatEntries(entries);
    strictEqual(lines.length, 3); // header, separator, 1 data row
    ok(lines[0].includes('PATTERN'));
    ok(lines[0].includes('SOURCE'));
    ok(lines[0].includes('REASON'));
    ok(lines[2].includes('**/.env'));
    ok(lines[2].includes('default'));
    ok(lines[2].includes('secrets'));
  });

  it('handles missing reason', () => {
    const entries = [
      { pattern: '~/.npmrc', source: 'user' },
    ];
    const lines = formatEntries(entries);
    strictEqual(lines.length, 3);
    ok(lines[2].includes('~/.npmrc'));
  });

  it('formats multiple entries', () => {
    const entries = [
      { pattern: 'a', source: 'default', reason: 'r1' },
      { pattern: 'b', source: 'user', reason: 'r2' },
      { pattern: 'c', source: 'user', reason: '' },
    ];
    const lines = formatEntries(entries);
    strictEqual(lines.length, 5); // header + separator + 3 rows
  });
});
