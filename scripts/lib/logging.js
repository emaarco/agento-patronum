/**
 * agento-patronum — Violation logging
 */

'use strict';

const fs = require('fs');

function logViolation(logFile, { tool, target, pattern }) {
  const entry = JSON.stringify({
    ts: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    tool,
    target,
    pattern,
  });
  try {
    fs.appendFileSync(logFile, entry + '\n');
  } catch {
    console.debug('patronum: could not write to log file', logFile);
  }
}

module.exports = { logViolation };
