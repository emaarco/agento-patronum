# Contributing

agento-patronum is open source. Whether you want to fix a bug, add a default pattern, or improve the docs — every contribution is welcome.

## Local Development

Clone the repo and run the self-test to confirm everything works:

```bash
git clone https://github.com/emaarco/agento-patronum.git
cd agento-patronum

# Validate all JSON files
node -e "for(const f of ['plugin.json','marketplace.json','hooks.json','defaults/patronum.json']){JSON.parse(require('fs').readFileSync(f.includes('/')?f:'.claude-plugin/'+f,'utf8'))}" && echo "All JSON valid"

# Run the full enforcement self-test
CLAUDE_PLUGIN_ROOT="$(pwd)" node scripts/management/patronum-verify.js
```

## Testing the Plugin Install Flow Locally

Before pushing changes to `.claude-plugin/`, verify the full marketplace install flow without needing a GitHub push:

```bash
# 1. Validate the plugin schema (built-in Claude Code validator)
/plugin validate .

# 2. Add the local repo as a marketplace
/plugin marketplace add /path/to/agento-patronum

# 3. Install the plugin from it
/plugin install patronum@agento-patronum

# 4. Verify protection is active, then clean up
/patronum-verify
/plugin uninstall agento-patronum
```

This catches invalid JSON, schema errors, source resolution failures, and install errors — all before any push.

## Documentation

The docs site is built with [VitePress](https://vitepress.dev/):

```bash
cd docs
npm install
npm run dev    # dev server at http://localhost:5173
npm run build  # production build
```

## Submitting Changes

1. Fork the repo and create a branch from `main`
2. Run validation (JSON check, `patronum-verify.js`) before pushing
3. Open a pull request — `@emaarco` is auto-assigned via CODEOWNERS
