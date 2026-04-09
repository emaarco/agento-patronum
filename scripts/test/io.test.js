'use strict';

const { describe, it } = require('node:test');
const { deepStrictEqual, rejects } = require('node:assert');
const { Readable } = require('stream');

// parseStdin reads from process.stdin, so we mock it per-test
// by temporarily replacing process.stdin
function parseStdinWith(data) {
  const original = process.stdin;
  const mock = new Readable({ read() { this.push(data); this.push(null); } });
  Object.defineProperty(process, 'stdin', { value: mock, writable: true, configurable: true });

  // Re-require to get a fresh module that reads from our mock
  delete require.cache[require.resolve('../lib/io')];
  const { parseStdin } = require('../lib/io');

  return parseStdin().finally(() => {
    Object.defineProperty(process, 'stdin', { value: original, writable: true, configurable: true });
    delete require.cache[require.resolve('../lib/io')];
  });
}

describe('parseStdin', () => {
  it('returns {} on empty input', async () => {
    const result = await parseStdinWith('');
    deepStrictEqual(result, {});
  });

  it('returns {} on whitespace-only input', async () => {
    const result = await parseStdinWith('   \n  ');
    deepStrictEqual(result, {});
  });

  it('parses valid JSON', async () => {
    const result = await parseStdinWith('{"tool_name":"Read"}');
    deepStrictEqual(result, { tool_name: 'Read' });
  });

  it('rejects on invalid JSON', async () => {
    await rejects(() => parseStdinWith('{broken'), { name: 'SyntaxError' });
  });
});
