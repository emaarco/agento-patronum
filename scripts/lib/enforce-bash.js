/**
 * agento-patronum — Bash command enforcement
 */

'use strict';

function enforceBash(input, entries) {
  const command = (input.tool_input && input.tool_input.command) || '';
  if (!command) return { blocked: false };

  for (const entry of entries) {
    if (!entry.pattern) continue;
    if (!entry.pattern.startsWith('Bash(') || !entry.pattern.endsWith(')')) continue;

    const blockedCmd = entry.pattern.slice(5, -1);
    if (command === blockedCmd || command.startsWith(blockedCmd + ' ')) {
      return {
        blocked: true,
        tool: 'Bash',
        target: `Bash(${command})`,
        pattern: entry.pattern,
        reason: entry.reason || '',
      };
    }
  }
  return { blocked: false };
}

module.exports = { enforceBash };
