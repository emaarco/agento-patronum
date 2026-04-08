---
name: create-ticket
argument-hint: "[feature|bug|refactor] \"<description>\""
description: "Create a GitHub issue for agento-patronum. Supports three types: feature/enhancement, bug, and refactor."
disable-model-invocation: true
allowed-tools: Bash(gh issue create *)
---

# Skill: create-ticket

Create a GitHub issue for agento-patronum using the correct template and title convention.

> **Sync note**: The body sections below mirror `.github/ISSUE_TEMPLATE/`. If templates change, update this skill to match.

## Supported types

| Type | Title convention | Label |
|------|-----------------|-------|
| `feature` | `As a <persona>, I want <goal>` | enhancement |
| `bug` | `<Component/Area>: <short description of the broken behavior>` | bug |
| `refactor` | `refactor: <what is being restructured and why>` | refactor |

## Steps

### 1. Determine ticket type
If not provided as argument, ask the user which type applies.

### 2. Confirm the title
Show the title convention for the chosen type and confirm with the user before proceeding. Keep titles concise (max ~72 characters).

### 3. Gather body content

**feature:** Summary, Current state, Desired state, Added value, Technical notes (optional)

**bug:** Summary, Steps to reproduce, Current behavior, Expected behavior, Technical context (optional)

**refactor:** Summary, Current state, Desired state, Added value, Technical notes (optional)

### 4. Create the issue

```bash
gh issue create \
  --title "<title>" \
  --label "<label>" \
  --body "<formatted body>"
```

Format body as Markdown with `##` headings matching the template field labels exactly. Example for a bug:

```
## Summary
<content>

## Steps to reproduce
<content>

## Current behavior
<content>

## Expected behavior
<content>

## Technical context
<content>
```

### 5. Report the issue URL
