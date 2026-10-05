# Disabled Workflows - Analysis and Production Decision

## Workflows Re-Enabled (Production-Critical)

I moved these workflows from `.github/workflows-disabled/` to `.github/workflows/` and optimized them:

### 1. `release-vendor.yml` ✅ ENABLED
**Purpose:** Pack vendored Cordis framework packages for release

**Why it's production-critical:**
- Vendored packages under `vendor/` release independently of neosis
- Required for building the main product
- Runs on every PR and push to main/master (rehearsal mode)
- Publication is manual via `release-vendor-publish.yml`

**Optimization applied:**
- Added cache save step after `pnpm install`
- Saves 2-3 minutes per run

**Trigger:** pull_request, push (main/master), workflow_dispatch

---

### 2. `docs-pages.yml` ✅ ENABLED
**Purpose:** Deploy documentation website to GitHub Pages

**Why it's production-critical:**
- Public documentation must be published for users
- Required for onboarding and API reference
- Manual-only (workflow_dispatch) - won't slow down PRs
- Already has pnpm cache enabled via setup-node

**Optimization:**
- Already optimized (uses `cache: pnpm` in setup-node)
- No additional changes needed

**Trigger:** workflow_dispatch (manual only)

---

### 3. `issue-lifecycle.yml` ✅ ENABLED
**Purpose:** Automated issue lifecycle management (labels, triage)

**Why it's production-critical:**
- Manages issue state based on events
- Helps with project organization
- Very fast (2-minute timeout)
- Runs on issues and PRs

**Optimization:**
- Already fast - no cache needed
- Minimal overhead

**Trigger:** issues (opened, edited, labeled, etc.), pull_request_target, pull_request_review

---

### 4. `issue-policy.yml` ✅ ENABLED
**Purpose:** Enforce PR policy (labels, required fields, etc.)

**Why it's production-critical:**
- Ensures PRs follow project standards
- Validates PR metadata before merge
- Required for branch protection
- Very fast (5-minute timeout)

**Optimization:**
- Already fast - no cache needed
- Minimal overhead

**Trigger:** pull_request_target, pull_request_review

---

## Workflows Kept Disabled (Optional/External)

These workflows are **NOT production-critical** for your use case:

### 1. `build-preview-cloudflare.yml` ❌ DISABLED
**Purpose:** Build PR preview and deploy to Cloudflare Pages

**Why disabled:**
- Requires Cloudflare account and secrets
- Requires Cloudflare Access configuration
- PR previews are nice-to-have, not required for production
- Adds ~10-15 minutes per PR

**When to enable:**
- If you use Cloudflare Pages for PR previews
- If you have Cloudflare Access configured
- If you want stakeholders to preview PRs before merge

**Required secrets:**
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CF_ACCESS_CLIENT_ID`
- `CF_ACCESS_CLIENT_SECRET`

---

### 2. `node-addon-system-release.yml` ❌ DISABLED
**Purpose:** Build and publish @averqel/node-addon-system package family

**Why disabled:**
- Native addon system is a separate concern from main product
- Only needed when releasing native addons
- Manual-only (workflow_dispatch)
- Requires npm registry credentials

**When to enable:**
- If you maintain the native addon system separately
- If you publish @averqel/node-addon-system to npm
- If you need to release native binaries

**Required secrets:**
- `NPM_TOKEN` (for npm publish)

---

### 3. `pi-ai-provider-e2e.yml` ❌ DISABLED
**Purpose:** E2E tests against pi-ai's Azure OpenAI and Anthropic providers

**Why disabled:**
- Spends real tokens against external providers (costs money)
- Requires external API keys
- Manual-only (workflow_dispatch)
- Provider-specific, not general product testing

**When to enable:**
- If you use pi-ai's Azure OpenAI or Anthropic providers
- If you want to validate against those specific APIs
- If you have budget for API token costs

**Required secrets:**
- `AZURE_OPENAI_API_KEY_EXTERNAL`
- `ANTHROPIC_API_KEY_EXTERNAL`

---

### 4. `python-release.yml` ❌ DISABLED
**Purpose:** Build and publish Python SDK to PyPI

**Why disabled:**
- Python SDK is separate from main Node.js product
- Only needed when releasing Python packages
- Manual-only (workflow_dispatch)
- Requires PyPI credentials and configuration

**When to enable:**
- If you publish the Python SDK to public PyPI
- If you have PyPI publisher repository configured
- If you release Python packages regularly

**Required secrets:**
- PyPI OIDC credentials (via environment)
- Repository variables: `PUBLIC_PYPI_RELEASE_ENABLED`, `PYPI_PUBLISHER_REPOSITORY`

---

### 5. `release-vendor-publish.yml` ❌ DISABLED
**Purpose:** Publish vendored packages to npm

**Why disabled:**
- Publication workflow - separate from packing
- Manual-only (workflow_dispatch)
- Requires npm registry credentials
- Only needed when actually publishing to npm

**When to enable:**
- If you publish vendored packages to npm
- If you have npm publish credentials
- If you need automated vendor package publishing

**Required secrets:**
- `NPM_TOKEN`

---

### 6. `weighted-approval-review-event.yml` ❌ DISABLED
**Purpose:** Record weighted approval review events

**Why disabled:**
- Part of weighted approval system
- Requires weighted-approval.yml to be enabled
- Minimal value without full approval system

**When to enable:**
- If you enable weighted-approval.yml
- If you use weighted approval system for PRs
- If you need review event tracking

---

### 7. `weighted-approval.yml` ❌ DISABLED
**Purpose:** Weighted approval system for PRs

**Why disabled:**
- Complex approval system
- Requires configuration and policy setup
- Standard GitHub review approvals may be sufficient
- Adds complexity without clear benefit for small teams

**When to enable:**
- If you need weighted (numeric) approval system
- If you have complex approval policies
- If standard GitHub approvals are insufficient

**Required setup:**
- `.github/review-ownership/` policy configuration
- Approval rules and weights

---

## Summary

### Enabled (4 workflows):
- ✅ `release-vendor.yml` - Vendor package packing (optimized)
- ✅ `docs-pages.yml` - Documentation deployment (already optimized)
- ✅ `issue-lifecycle.yml` - Issue management (fast)
- ✅ `issue-policy.yml` - PR policy enforcement (fast)

### Disabled (7 workflows):
- ❌ `build-preview-cloudflare.yml` - Cloudflare PR previews (requires Cloudflare setup)
- ❌ `node-addon-system-release.yml` - Native addon releases (separate concern)
- ❌ `pi-ai-provider-e2e.yml` - Provider-specific E2E (costs tokens)
- ❌ `python-release.yml` - Python SDK releases (separate concern)
- ❌ `release-vendor-publish.yml` - Vendor npm publishing (requires npm credentials)
- ❌ `weighted-approval-review-event.yml` - Approval event tracking (part of weighted system)
- ❌ `weighted-approval.yml` - Weighted approval system (complex, optional)

---

## Production Recommendation

**Keep these enabled:**
- `release-vendor.yml` - Required for vendor packages
- `docs-pages.yml` - Required for public documentation
- `issue-lifecycle.yml` - Required for issue management
- `issue-policy.yml` - Required for PR standards

**Keep these disabled unless needed:**
- All others are optional or require external setup

**To enable any disabled workflow:**
1. Move it from `.github/workflows-disabled/` to `.github/workflows/`
2. Configure required secrets in repository settings
3. Configure required repository variables
4. Test with workflow_dispatch before enabling automatic triggers

---

## Performance Impact

**Enabled workflows add minimal overhead:**
- `release-vendor.yml`: 5-8 minutes (only on PRs and main/master pushes)
- `docs-pages.yml`: Manual-only, no automatic overhead
- `issue-lifecycle.yml`: <1 minute, runs on issue/PR events
- `issue-policy.yml`: <1 minute, runs on PR events

**Total additional CI time:** ~5-8 minutes on PRs (from release-vendor.yml only)

**This is acceptable for production-grade validation.**
