---
name: preview-docs
description: "Start the VitePress documentation dev server for local preview."
disable-model-invocation: true
allowed-tools: Bash(cd docs && npm *), Bash(npm *)
---

# Skill: preview-docs

Start the VitePress dev server for local documentation preview.

## Steps

1. Start the dev server:

```bash
cd docs && npm run dev
```

2. The server starts with a local URL. Share the URL with the user.

3. To build for production (catches broken links):

```bash
cd docs && npm run build
```
