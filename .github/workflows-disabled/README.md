# Disabled release workflows

These workflows are kept out of `.github/workflows/` while package publication and documentation deployment are not in use. GitHub Actions only discovers workflow definitions under `.github/workflows/`, so files in this directory do not run.

Moved workflows:

- `docs-pages.yml` — GitHub Pages documentation deployment.
- `node-addon-system-release.yml` — native addon package release and npm publication.
- `python-release.yml` — Python wheel release and PyPI publication.
- `release-publish.yml` — NeoSIS npm publication.
- `release-vendor-publish.yml` — vendored package npm publication.
- `release-vendor.yml` — vendored package release rehearsal.
- `release.yml` — NeoSIS release rehearsal.
- `pi-ai-provider-e2e.yml` — optional Azure OpenAI and Anthropic provider tests.

The build, DeepSeek E2E, CI, sandbox, approval, and issue-policy workflows remain active. `build-exe-for-python-sdk.yml` remains in `.github/workflows/` because CI calls it as a reusable workflow.

To restore a workflow later, move that file back into `.github/workflows/`, validate it, and enable the corresponding GitHub Actions workflow before dispatching it.
