#!/usr/bin/env node
/**
 * agento-patronum — UserPromptSubmit enforcement hook
 * Blocks @mention references to protected files before Claude sees their content.
 * Manage with: /patronum-add /patronum-remove /patronum-list
 */

'use strict';

const { enforcePrompt } = require('./lib/enforce');
const { runHook } = require('./lib/runHook');

runHook(
  (input, entries, home, cwd) => enforcePrompt(input, entries, home, cwd),
  { failOpenOnBadConfig: true },
);
