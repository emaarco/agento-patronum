#!/usr/bin/env node
/**
 * agento-patronum — PreToolUse Bash enforcement hook
 * Blocks Bash commands matching protected Bash(command) patterns.
 * Manage with: /patronum-add /patronum-remove /patronum-list
 */

'use strict';

const { enforceBash } = require('./lib/enforce');
const { runHook } = require('./lib/runHook');

runHook((input, entries) => enforceBash(input, entries));
