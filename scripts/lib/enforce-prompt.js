/**
 * agento-patronum — Prompt @mention enforcement
 */

'use strict';

const path = require('path');
const { matchGlob } = require('./matching');

function enforcePrompt(input, entries, home, cwd) {
  const prompt = input.prompt || '';
  if (!prompt) return { blocked: false };

  const mentions = prompt.match(/@[^\s"'`]+/g) || [];
  if (mentions.length === 0) return { blocked: false };

  for (const mention of mentions) {
    const raw = mention.slice(1);

    let absPath;
    if (raw.startsWith('/')) {
      absPath = raw;
    } else if (raw.startsWith('~')) {
      absPath = raw.replace(/^~/, home);
    } else {
      absPath = path.join(cwd, raw);
    }

    for (const entry of entries) {
      if (!entry.pattern || entry.pattern.startsWith('Bash(')) continue;
      if (matchGlob(absPath, entry.pattern, home)) {
        return {
          blocked: true,
          tool: 'UserPromptSubmit',
          target: mention,
          pattern: entry.pattern,
          reason: entry.reason || '',
        };
      }
    }
  }
  return { blocked: false };
}

module.exports = { enforcePrompt };
