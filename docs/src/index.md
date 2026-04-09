---
layout: home

hero:
  name: agento-patronum
  text: Your secrets. Protected.
  tagline: AI coding agents read everything. Your Patronum decides what's off-limits.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/installation
    - theme: alt
      text: View on GitHub
      link: https://github.com/emaarco/agento-patronum

features:
  - icon: "\uD83D\uDD12"
    title: Hook-Based Enforcement
    details: Built-in access controls may not always be reliable. agento-patronum uses PreToolUse hooks — an explicit enforcement layer you control and can verify yourself.
  - icon: "\uD83E\uDDD9"
    title: Stack-Aware Suggestions
    details: Detects your tech stack and suggests what to protect. AWS, Terraform, Docker, GCP — it knows the sensitive files before you do.
  - icon: "\uD83D\uDCE6"
    title: Install Once, Always Protected
    details: Two commands to install. Your custom rules survive plugin updates. Every blocked action is logged for audit. Pure bash + jq, no dependencies.
---

<div class="early-version-banner">
  Early version — agento-patronum is under active development (v0.1.0). Features and defaults may change between releases. Feedback is very welcome.
</div>

<div class="landing-content">

<hr class="section-divider" />

<div class="section-block problem-block">

## The invisible risk

<div class="problem-layout">
<div class="problem-text">

AI coding agents are transforming how we build software. By default, they have access to everything in your project — `.env` files, SSH keys, AWS credentials, and API tokens. Not maliciously, just helpfully.

Most developers using AI agents today either aren't aware of this exposure — or are, and simply haven't tackled it yet.
If you haven't explicitly restricted what your agent can read, your credentials are likely in scope.

Most tools offer some access controls. Whether those reliably work in all cases is hard to know — [past reports](https://github.com/anthropics/claude-code/issues/6699) suggest there can be gaps. Rather than relying on built-in rules and hoping for the best, agento-patronum gives you explicit, hook-based control you can verify yourself.

It's one approach — there are others, and you can also roll your own. The goal is simply to make file protection accessible and transparent.

</div>
<div class="exposed-tags">
<div class="exposed-label">May be accessible</div>
<div class="tags">
<span class="tag">~/.ssh/id_rsa</span>
<span class="tag">~/.aws/credentials</span>
<span class="tag">.env</span>
<span class="tag">.env.production</span>
<span class="tag">**/*.pem</span>
<span class="tag">**/*.key</span>
<span class="tag">~/.docker/config.json</span>
<span class="tag">~/.kube/config</span>
<span class="tag">~/.npmrc</span>
<span class="tag">~/.pypirc</span>
</div>
</div>
</div>

</div>

<hr class="section-divider" />

<div class="section-block flow-block">

## How it works

agento-patronum intercepts every tool call **before execution**. If the target matches a protected pattern, the call is blocked and logged. [Learn how it works under the hood.](/internals/how-it-works)

<div class="flow-steps">
<div class="flow-step step-purple">
<div class="flow-icon">💬</div>
<div class="flow-label">Claude Code</div>
<div class="flow-desc">calls Read, Write, Edit, or Bash</div>
</div>
<div class="flow-arrow">→</div>
<div class="flow-step step-amber">
<div class="flow-icon">🛡️</div>
<div class="flow-label">PreToolUse Hook</div>
<div class="flow-desc">patronum-hook.sh intercepts</div>
</div>
<div class="flow-arrow">→</div>
<div class="flow-step step-green">
<div class="flow-icon">🔍</div>
<div class="flow-label">Pattern Match</div>
<div class="flow-desc">check patronum.json</div>
</div>
<div class="flow-arrow">→</div>
<div class="flow-step step-result">
<div class="flow-icon">🚫</div>
<div class="flow-label">Blocked</div>
<div class="flow-desc">exit 2 + logged</div>
</div>
</div>

</div>

<hr class="section-divider" />

</div>

<div class="cta-section">
<h2 class="cta-heading">Ready to protect your secrets?</h2>
<p class="cta-desc">Install agento-patronum in two commands — hook active, credentials shielded.</p>

<div class="cta-install">
<div class="cta-step">
<span class="cta-step-label">1</span>
<code class="cta-command">/plugin marketplace add emaarco/agento-patronum</code>
</div>
<div class="cta-step">
<span class="cta-step-label">2</span>
<code class="cta-command">/plugin install agento-patronum@emaarco</code>
</div>
</div>

<div class="cta-buttons">
<a href="/agento-patronum/getting-started/installation" class="cta-secondary">Installation</a>
<a href="/agento-patronum/getting-started/default-protections" class="cta-secondary">See default protections</a>
<a href="/agento-patronum/internals/how-it-works" class="cta-secondary">How it works</a>
</div>
</div>

<style>
.landing-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.section-divider {
  border: none;
  border-top: 1px solid var(--vp-c-divider);
  margin: 0;
}

.section-block {
  padding: 2rem 0;
}

.section-block h2 {
  border-top: none;
  margin-top: 0;
}

/* Problem section */
.problem-layout {
  display: flex;
  gap: 2.5rem;
  align-items: flex-start;
  margin-top: 1rem;
}

.problem-text {
  flex: 1;
}

.exposed-tags {
  flex: 0 0 220px;
}

.exposed-label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
  margin-bottom: 0.6rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tag {
  display: inline-block;
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger-1);
  border-radius: 4px;
  line-height: 1.4;
}

/* Flow section */
.flow-steps {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
  margin: 1.5rem 0 1rem;
  justify-content: flex-start;
}

.flow-step {
  flex: 1;
  min-width: 0;
  text-align: center;
  padding: 0.8rem 1rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.step-purple {
  background: var(--vp-c-brand-soft);
  border: 1px solid var(--vp-c-brand-1);
}

.step-amber {
  background: #fef3c7;
  border: 1px solid #d97706;
}

.step-green {
  background: var(--vp-c-green-soft);
  border: 1px solid var(--vp-c-green-1);
}

.dark .step-amber {
  background: rgba(217, 119, 6, 0.12);
}

.flow-icon {
  font-size: 1.2rem;
  margin-bottom: 0.2rem;
}

.flow-label {
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--vp-c-text-1);
}

.flow-desc {
  font-size: 0.7rem;
  color: var(--vp-c-text-2);
  margin-top: 0.1rem;
}

.flow-arrow {
  font-size: 1.1rem;
  color: var(--vp-c-text-3);
  font-weight: 300;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.step-result {
  background: var(--vp-c-danger-soft);
  border: 1px solid var(--vp-c-danger-1);
  align-items: center;
  justify-content: center;
}

.step-result .flow-label {
  color: var(--vp-c-danger-1);
}

.step-result .flow-desc {
  color: var(--vp-c-danger-2);
}

/* CTA section */
.cta-section {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem 3rem;
  text-align: left;
}

.cta-heading {
  font-size: 1.4rem !important;
  font-weight: 700 !important;
  margin: 0 0 0.5rem !important;
  border: none !important;
  padding: 0 !important;
  color: var(--vp-c-text-1);
}

.cta-desc {
  margin: 0 0 1.5rem !important;
  color: var(--vp-c-text-2);
  font-size: 1rem;
}

.cta-install {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0 0 1.5rem;
}

.cta-step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 0.6rem 1rem;
}

.cta-step-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.cta-command {
  font-family: var(--vp-font-family-mono);
  font-size: 0.85rem;
  color: var(--vp-c-text-1);
  background: none !important;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.cta-secondary {
  display: inline-block;
  padding: 0.65rem 1.6rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none !important;
  color: var(--vp-c-text-1) !important;
  transition: border-color 0.2s;
}

.cta-secondary:hover {
  border-color: var(--vp-c-brand-1);
}

@media (max-width: 640px) {
  .problem-layout {
    flex-direction: column;
  }
  .exposed-tags {
    flex: auto;
    width: 100%;
  }
  .flow-arrow {
    display: none;
  }
  .flow-steps {
    flex-direction: column;
    gap: 0.6rem;
  }
  .flow-step {
    flex: auto;
    width: 100%;
  }
}

</style>
