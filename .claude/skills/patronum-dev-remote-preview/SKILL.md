---
name: patronum-dev-remote-preview
description: "Preview docs remotely (e.g. via dispatch or mobile) when not at the machine running the agent. Starts a public tunnel to the local docs dev server."
disable-model-invocation: false
allowed-tools: Bash(cd * && npx *), Bash(npx *), Bash(kill *), Bash(pkill *)
---

# Skill: patronum-dev-remote-preview

Preview docs when working remotely (e.g. via dispatch or Claude mobile app) and you don't have direct access to the machine running the agent. Starts a VitePress dev server and exposes it via a public tunnel.

## Steps

### 1. Kill any existing dev servers

```bash
pkill -f "vitepress dev" 2>/dev/null || true
pkill -f tunnelmole 2>/dev/null || true
```

Wait 2 seconds for processes to stop.

### 2. Start VitePress dev server

```bash
cd docs && npx vitepress dev src --host --base / &
```

Wait 3 seconds for the server to start. Note the port from the output (default: 5173, may auto-increment if busy).

### 3. Start tunnel

Use the port from step 2:

```bash
npx tunnelmole <port>
```

### 4. Report

Show the user the public HTTPS URL from tunnelmole output as a plain URL (no markdown formatting, no bold, no stars). Tell them to open it on their phone or any device.
