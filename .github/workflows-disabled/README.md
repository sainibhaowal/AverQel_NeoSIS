# Disabled solo-unneeded workflows

These workflows are kept out of `.github/workflows/` while their process is not in use. GitHub Actions only discovers workflow definitions under `.github/workflows/`, so files in this directory do not run.

Moved workflows:

- `docs-pages.yml` — GitHub Pages documentation deployment.
- `node-addon-system-release.yml` — native addon package release and npm publication.
- `python-release.yml` — Python wheel release and PyPI publication.
- `release-vendor-publish.yml` — vendored package npm publication.
- `release-vendor.yml` — vendored package release rehearsal.
- `pi-ai-provider-e2e.yml` — optional Azure OpenAI and Anthropic provider tests.
- `weighted-approval.yml` — multi-reviewer weighted approval publisher (needs a review team).
- `weighted-approval-review-event.yml` — review-event recorder for the approval publisher.
- `issue-policy.yml` — PR label and Issue-reference policy gate (needs the labeling discipline).
- `issue-lifecycle.yml` — Project board lifecycle automation (needs the issue-management process).
- `build-preview-cloudflare.yml` — per-PR Cloudflare Pages preview deployments.

The build, DeepSeek E2E, CI, sandbox, and npm release workflows remain active. `build-exe-for-python-sdk.yml` remains in `.github/workflows/` because CI calls it as a reusable workflow.

To restore a workflow later, move that file back into `.github/workflows/`, validate it, and enable the corresponding GitHub Actions workflow before dispatching it.
