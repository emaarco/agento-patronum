/**
 * agento-patronum — Pure enforcement functions
 * Each function takes parsed input + entries, returns a decision.
 * No I/O, no process.exit, no config loading.
 */

'use strict';

const path = require('path');
const { matchGlob } = require('./patronum');

// ── File enforcement ────────────────────────────────────────────────────────

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

// ── Bash enforcement ────────────────────────────────────────────────────────

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

// ── Prompt enforcement ──────────────────────────────────────────────────────

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

// ── Exports ─────────────────────────────────────────────────────────────────

module.exports = { enforceFile, enforceBash, enforcePrompt, extractFilePaths };
