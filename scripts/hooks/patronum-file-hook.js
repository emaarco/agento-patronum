#!/usr/bin/env node
/**
 * agento-patronum — PreToolUse file enforcement hook
 * Blocks Read/Write/Edit/MultiEdit operations on protected file paths.
 * Manage with: /patronum-add /patronum-remove /patronum-list
 */

'use strict';

const path = require('path');
const { matchGlob } = require('../lib/matching');
const { loadBlacklist } = require('../lib/config');
const { parseStdin } = require('../lib/io');
const { logViolation } = require('../lib/logging');

// ── Enforce logic ───────────────────────────────────────────────────────

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
    case 'Glob':
    case 'Grep':
      return toolInput.path ? [toolInput.path] : [];
    default:
      return [];
  }
}

function isWhitelistedFile(filePath, whitelist, home) {
  for (const entry of whitelist) {
    if (!entry.pattern || entry.pattern.startsWith('Bash(')) continue;
    if (matchGlob(filePath, entry.pattern, home)) return true;
  }
  return false;
}

/**
 * For Glob tool: check if the requested glob pattern would enumerate
 * protected files. Tests each protected pattern's basename against the
 * Glob tool's pattern using our own glob matcher.
 */
function enforceGlobPattern(input, blacklist, whitelist, home) {
  const toolName = input.tool_name || '';
  if (toolName !== 'Glob') return { blocked: false };

  const globPattern = (input.tool_input && input.tool_input.pattern) || '';
  if (!globPattern) return { blocked: false };

  home = home || process.env.HOME || '';

  for (const entry of blacklist) {
    if (!entry.pattern || entry.pattern.startsWith('Bash(')) continue;

    // Expand the protected pattern and extract its basename for comparison.
    const expanded = entry.pattern.replace(/^~/, home);
    const protectedBase = path.basename(expanded);

    // Extract the basename from the Glob pattern for comparison.
    const globBase = path.basename(globPattern);

    // Check if the Glob pattern could match the protected pattern's basename.
    // e.g. Glob pattern "**/.env*" basename ".env*" matches protected ".env"
    if (matchGlob(protectedBase, globBase, home)) {
      if (isWhitelistedFile(protectedBase, whitelist, home)) continue;
      return {
        blocked: true,
        tool: 'Glob',
        target: `Glob(${globPattern})`,
        pattern: entry.pattern,
        reason: entry.reason || 'Glob pattern would enumerate protected files',
      };
    }

    // Also check if the full Glob pattern matches the full protected pattern.
    if (matchGlob(expanded, globPattern, home)) {
      if (isWhitelistedFile(expanded, whitelist, home)) continue;
      return {
        blocked: true,
        tool: 'Glob',
        target: `Glob(${globPattern})`,
        pattern: entry.pattern,
        reason: entry.reason || 'Glob pattern would enumerate protected files',
      };
    }
  }
  return { blocked: false };
}

function enforceFile(input, blacklist, whitelist, home) {
  const toolName = input.tool_name || '';
  if (!toolName) return { blocked: false };

  // Check file paths (works for Read/Write/Edit/MultiEdit/Glob/Grep)
  const filePaths = extractFilePaths(input);
  for (const filePath of filePaths) {
    if (isWhitelistedFile(filePath, whitelist, home)) continue;
    for (const entry of blacklist) {
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

  // For Glob tool, also check if the pattern itself would enumerate protected files
  const globResult = enforceGlobPattern(input, blacklist, whitelist, home);
  if (globResult.blocked) return globResult;

  return { blocked: false };
}

// ── Hook entry point ────────────────────────────────────────────────────

if (require.main === module) {
  const { config, blacklist, whitelist } = loadBlacklist();

  parseStdin().then((input) => {
    const result = enforceFile(input, blacklist, whitelist, process.env.HOME);

    if (result.blocked) {
      logViolation(config.logFile, { tool: result.tool, target: result.target, pattern: result.pattern });
      process.stderr.write(`PATRONUM_VIOLATION: Access to '${result.target}' blocked. Pattern: ${result.pattern}\n`);
      if (result.reason) process.stderr.write(`Reason: ${result.reason}\n`);
      process.stderr.write('Manage with: /patronum-add or /patronum-remove in Claude Code\n');
      process.exit(2);
    }

    process.exit(0);
  });
}

module.exports = { enforceFile, enforceGlobPattern, extractFilePaths, isWhitelistedFile };
