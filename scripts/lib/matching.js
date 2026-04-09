/**
 * agento-patronum — Glob pattern matching
 * Ports bash's [[ "$path" == $pattern ]] where * matches everything including /
 */

'use strict';

const path = require('path');

function globTest(str, pattern) {
  const re = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp('^' + re + '$').test(str);
}

function matchGlob(filePath, pattern, home) {
  home = home || process.env.HOME || '';
  let p = pattern.replace(/^~/, home);
  let fp = filePath.replace(/^~/, home);

  // Normalize **/ to */ — bash [[ ]] treats * as matching /
  p = p.replace(/\*\*\//g, '*/');

  // Check for leading */ pattern — also match bare basename
  const isDeep = p.startsWith('*/');
  const bnPattern = isDeep ? p.slice(2) : null;

  if (globTest(fp, p)) return true;
  if (bnPattern) return globTest(path.basename(fp), bnPattern);
  return false;
}

module.exports = { globTest, matchGlob };
