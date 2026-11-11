# Branch Protection Rules

## Setup Instructions

To protect the `main` branch, configure the following rules in GitHub:

### 1. Go to Settings → Branches

### 2. Add branch protection rule for `main`

**Required status checks:**

- [x] CI / CI
- [x] PR Check / PR Validation

**Protection settings:**

- [x] Require a pull request before merging
  - [x] Require approvals (1)
  - [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Require status checks to pass before merging
  - [x] Require branches to be up to date before merging
- [x] Require conversation resolution before merging
- [x] Do not allow bypassing the above settings

### 3. Additional Settings (Optional)

**Code quality:**

- [x] Require linear history
- [x] Include administrators
- [x] Restrict who can push to matching branches

## npm Trusted Publishing

`release.yml` publishes through npm trusted publishing (OIDC), so the repository holds no npm token.
The package must exist on npm before it can trust the workflow, so publish the first version by hand:

1. `npm login`, with two-factor authentication on the account
2. `bun publish --access public`
3. `npx npm@latest trust github apple-docs-mcp-next --file release.yml --repository xsyetopz/apple-docs-mcp-next --allow-publish`

Later versions publish when a `v*` tag matching the `package.json` version is pushed.

## Workflow Status Badges

Add these badges to your README.md:

```markdown
[![CI](https://github.com/xsyetopz/apple-docs-mcp-next/actions/workflows/ci.yml/badge.svg)](https://github.com/xsyetopz/apple-docs-mcp-next/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/apple-docs-mcp-next.svg)](https://www.npmjs.com/package/apple-docs-mcp-next)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```
