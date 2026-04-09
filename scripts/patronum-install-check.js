#!/usr/bin/env node
/**
 * agento-patronum — UserPromptSubmit hook
 * Lazy init guard: ensures setup has run even when SessionStart hasn't fired
 * (e.g. after /plugin install + /reload-plugins without a full session restart).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const userConfig = path.join(process.env.HOME || '', '.claude', 'patronum', 'patronum.json');

// Fast path: already initialized
if (fs.existsSync(userConfig)) process.exit(0);

// Lazy init: plugin was loaded but SessionStart hasn't fired yet.
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
execSync(`node "${path.join(pluginRoot, 'scripts', 'patronum-setup.js')}"`, { stdio: 'inherit' });
