/**
 * agento-patronum — Glob pattern matching
 * Ports bash's [[ "$path" == $pattern ]] where * matches everything including /
 */

'use strict';

const fs = require('fs');
const path = require('path');

function globTest(str, pattern) {
  const re = pattern
    // ReDoS prevention: collapse consecutive stars so "*****" becomes one ".*"
    // instead of ".*.*.*.*.*" which causes exponential backtracking.
    // See: https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS
    .replace(/\*{2,}/g, '*')
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  const flags = process.platform === 'darwin' ? 'i' : '';
  return new RegExp('^' + re + '$', flags).test(str);
}

// Canonicalizes file paths before matching to prevent two bypass vectors:
// - Path traversal: "/project/sub/../../.env" would dodge a "**/.env" pattern.
//   See: https://owasp.org/www-community/attacks/Path_Traversal
// - Symlink bypass: /tmp/innocent.txt -> ~/.ssh/id_rsa would dodge "~/.ssh/*".
//   See: https://cwe.mitre.org/data/definitions/59.html
function matchGlob(filePath, pattern, home) {
  home = home || process.env.HOME || '';
  let p = pattern.replace(/^~/, home);
  let fp = filePath.replace(/^~/, home);

  fp = path.resolve(fp);
  try {
    fp = fs.realpathSync(fp);
  } catch {
    console.debug('patronum: could not resolve symlink for', fp);
  }

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
