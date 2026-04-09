#!/usr/bin/env node
/**
 * agento-patronum — PreToolUse file enforcement hook
 * Blocks Read/Write/Edit/MultiEdit operations on protected file paths.
 * Manage with: /patronum-add /patronum-remove /patronum-list
 */

'use strict';

const { enforceFile } = require('./lib/enforce');
const { runHook } = require('./lib/runHook');

runHook((input, entries, home) => enforceFile(input, entries, home));
