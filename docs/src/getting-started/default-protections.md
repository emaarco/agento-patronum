# Default Protections

agento-patronum ships with a curated set of protection patterns covering common sensitive files and commands.

## Environment Files

| Pattern | Reason |
|---------|--------|
| `**/.env` | Environment files may contain credentials |
| `**/.env.*` | Environment variable overrides may contain secrets |

## Private Keys & Certificates

| Pattern | Reason |
|---------|--------|
| `**/*.pem` | PEM files contain private keys or certificates |
| `**/*.key` | Key files contain private keys |

## SSH

| Pattern | Reason |
|---------|--------|
| `~/.ssh/*` | SSH directory contains private keys and config |

## Cloud Credentials

| Pattern | Reason |
|---------|--------|
| `~/.aws/credentials` | AWS credentials file contains access keys |
| `~/.aws/config` | AWS config may contain sensitive account data |
| `~/.docker/config.json` | Docker config may contain registry auth tokens |
| `~/.kube/config` | Kubernetes config contains cluster credentials |

## Package Manager Tokens

| Pattern | Reason |
|---------|--------|
| `~/.npmrc` | NPM config may contain auth tokens |
| `~/.pypirc` | PyPI config may contain auth tokens |

## Bash Commands

| Pattern | Reason |
|---------|--------|
| `Bash(printenv)` | Exposes all environment variables including secrets |
| `Bash(env)` | Exposes all environment variables including secrets |
| `Bash(set)` | Exposes all shell variables including secrets |

## Need more?

Use `/patronum-suggest` to get stack-specific recommendations, or add your own patterns with `/patronum-add`.

Think a pattern should be included by default? [Open a feature request](https://github.com/emaarco/agento-patronum/issues/new?template=feature_request.yml) on GitHub.
