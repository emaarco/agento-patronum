/**
 * agento-patronum — File enforcement (Read/Write/Edit/MultiEdit)
 */

'use strict';

const { matchGlob } = require('./matching');

function enforceFile(input, entries, home) {
  const toolName = input.tool_name || '';
  if (!toolName) return { blocked: false };

  const filePaths = extractFilePaths(input);
  for (const filePath of filePaths) {
    for (const entry of entries) {
      if (!entry.pattern || entry.pattern.startsWith('Bash(')) continue;
      if (matchGlob(filePath, entry.pattern, home)) {
        return {
          blocked: true,
          tool: toolName,
          target: filePath,
          pattern: entry.pattern,
          reason: entry.reason || '',
        };
      }
    }
  }
  return { blocked: false };
}

function extractFilePaths(input) {
  const toolName = input.tool_name || '';
  const toolInput = input.tool_input || {};

  switch (toolName) {
    case 'Read':
    case 'Write':
    case 'Edit':
      return toolInput.file_path ? [toolInput.file_path] : [];
    case 'MultiEdit':
      return (toolInput.edits || []).map((e) => e.file_path).filter(Boolean);
    default:
      return [];
  }
}

module.exports = { enforceFile, extractFilePaths };
