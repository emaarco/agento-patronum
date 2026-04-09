/**
 * agento-patronum — Stdin reading utilities
 */

'use strict';

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
  });
}

async function parseStdin() {
  const raw = await readStdin();
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

module.exports = { readStdin, parseStdin };
