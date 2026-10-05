# Python and Vendor Release Workflows - Detailed Explanation

## 1. `python-release.yml` - Python SDK Release

### What it does:

**Builds and publishes Python packages to PyPI (Python Package Index)**

This workflow releases the Python SDK and runtime to the public PyPI registry so Python developers can install them with `pip install`.

### What it releases:

**Two Python packages:**

1. **`averqel-neosis-sdk`** (Python SDK wheel)
   - High-level turns API and JSON-RPC client
   - Pure Python code (no native dependencies)
   - Platform-independent: `py3-none-any.whl`
   - Allows Python developers to programmatically control NeoSIS

2. **`averqel-neosis-runtime-bin`** (Runtime binary wheel)
   - Bundled `neosis` CLI executable
   - Native sidecars (compiled code)
   - Platform-specific wheels for 5 platforms:
     - `manylinux_2_28_x86_64` (Linux x64)
     - `manylinux_2_28_aarch64` (Linux ARM64)
     - `macosx_14_0_x86_64` (macOS Intel)
     - `macosx_14_0_arm64` (macOS Apple Silicon)
     - `win_amd64` (Windows x64)

### Workflow steps:

1. **Build job** - Builds 6 wheels (1 SDK + 5 runtime binaries) using `build-exe-for-python-sdk.yml`
2. **Python compatibility job** - Tests wheels work with Python 3.10 and 3.14
3. **Validate job** - Checks wheel contents, validates metadata, records SHA256 hashes
4. **Publish runtime job** - Publishes runtime wheels to PyPI (if publish=true)
5. **Publish SDK job** - Publishes SDK wheel to PyPI (if publish=true)

### When it runs:

- **Manual only** (workflow_dispatch)
- Must run from a `python-v*` tag to publish
- Can run in "dry run" mode (publish=false) to validate without publishing

### What users get:

```bash
# Python developers can install:
pip install averqel-neosis-sdk
pip install averqel-neosis-runtime-bin

# Then use in Python:
from averqel_neosis import NeoSIS

# Start NeoSIS from Python
agent = NeoSIS(profile="headless")
result = agent.run("Write a function that sorts a list")
```

### Is it important for production?

**YES, if you have Python users:**
- Required for Python developers to use your product
- Required for Python SDK distribution
- Required for PyPI presence

**NO, if you only have Node.js users:**
- The main product is Node.js-based
- Python SDK is optional for Python developers
- Can be released later when needed

### Requirements to enable:

**Repository variables:**
- `PUBLIC_PYPI_RELEASE_ENABLED=true`
- `PYPI_PUBLISHER_REPOSITORY=<your-repo-name>`

**GitHub environments:**
- `pypi-runtime` (for runtime wheels)
- `pypi` (for SDK wheel)

**PyPI account:**
- OIDC authentication configured
- Trusted publisher setup on PyPI

---

## 2. `release-vendor-publish.yml` - Vendor Package Publishing

### What it does:

**Publishes vendored Cordis framework packages to npm**

This workflow publishes the 9 vendored Cordis packages (under `vendor/`) to the public npm registry.

### What it releases:

**9 rescoped Cordis packages:**

The `vendor/` directory contains the Cordis framework (a plugin system/framework) that NeoSIS uses. These packages are:
- Rescoped from their original names to `@averqel/cordis-*`
- Published independently of the main NeoSIS packages
- Required for building NeoSIS

**Examples (hypothetical names):**
- `@averqel/cordis-core`
- `@averqel/cordis-plugin`
- `@averqel/cordis-hooks`
- ... (9 total packages)

### Workflow steps:

1. **Pack job** - Packs npm tarballs from the vendored packages
   - Builds TypeScript
   - Verifies release version
   - Packs tarballs to `dist/npm-vendor/`
   - Validates packed install
   - Uploads artifacts

2. **Publish job** - Publishes tarballs to npm
   - Downloads artifacts
   - Uses npm registry credentials
   - Publishes all vendor packages to npm

### When it runs:

- **Manual only** (workflow_dispatch)
- Must run from a `vendor-*` tag
- Separate from `release-vendor.yml` (which only packs, doesn't publish)

### Relationship to `release-vendor.yml`:

**`release-vendor.yml`** (already enabled):
- Packs vendor packages
- Runs on every PR and push (rehearsal mode)
- Does NOT publish to npm
- Validates that packages can be packed

**`release-vendor-publish.yml`** (currently disabled):
- Publishes vendor packages to npm
- Manual only
- Requires npm credentials
- Actually publishes to public registry

### Why they're separate:

**Security and control:**
- Packing can run frequently (on every PR) to validate
- Publishing should be explicit, manual, and reviewed
- Separation prevents accidental publishes
- Publication requires environment approval

### Is it important for production?

**YES, if you publish vendor packages:**
- Required for other projects to depend on your Cordis fork
- Required for npm registry presence
- Required if you maintain Cordis separately

**NO, if vendor packages are internal-only:**
- If only NeoSIS uses the vendored packages
- If you don't publish them to npm
- If they're bundled with NeoSIS releases

### Requirements to enable:

**GitHub secrets:**
- `NPM_TOKEN` - npm authentication token with publish permissions

**GitHub environments:**
- `npm-publish` - environment with required reviewers

**npm account:**
- npm token with publish permissions for @averqel scope
- Package access configured for @averqel org

---

## Summary Comparison

| Aspect | Python Release | Vendor Publish |
|--------|---------------|----------------|
| **Target** | PyPI (Python registry) | npm (JavaScript registry) |
| **Packages** | 2 Python packages (SDK + runtime) | 9 vendor Cordis packages |
| **Platforms** | 5 platforms (Linux x64/ARM64, macOS x64/ARM64, Windows) | Platform-independent JS packages |
| **Users** | Python developers | JavaScript/TypeScript developers |
| **Trigger** | Manual from `python-v*` tag | Manual from `vendor-*` tag |
| **Credentials** | PyPI OIDC + repository variables | npm token |
| **Importance** | Optional for Python users | Optional if vendor is internal |

---

## When to Enable Each

### Enable `python-release.yml` if:

- ✅ You have Python developers using your SDK
- ✅ You want to distribute on PyPI
- ✅ You have PyPI account and OIDC configured
- ✅ You're ready to support Python users

### Keep disabled if:
- ❌ You only have Node.js users
- ❌ Python SDK is not yet ready for public release
- ❌ You don't have PyPI set up

### Enable `release-vendor-publish.yml` if:

- ✅ You publish vendor packages to npm
- ✅ Other projects depend on your Cordis fork
- ✅ You have npm account with @averqel scope
- ✅ You maintain Cordis as a separate product

### Keep disabled if:
- ❌ Vendor packages are internal-only
- ❌ Only NeoSIS uses the vendored packages
- ❌ You don't publish to npm

---

## My Recommendation

**For your current setup:**

**Keep both disabled** because:
1. **Python SDK** - Your main product is Node.js-based; Python SDK is optional
2. **Vendor publish** - Vendor packages are likely internal to NeoSIS; not published publicly

**Enable later when:**
- You have Python users requesting the SDK
- You want to publish Cordis framework separately
- You have the required credentials and accounts configured

**They don't affect CI performance** because:
- Both are manual-only (workflow_dispatch)
- They don't run on PRs or pushes
- They won't slow down your CI

---

## What You Get Without Them

**Without Python release:**
- Python developers cannot `pip install` your SDK
- You can still build Python packages locally
- You can still use Python SDK internally

**Without vendor publish:**
- Vendor packages are not on npm
- NeoSIS still works (bundles vendor packages)
- Other projects cannot depend on your Cordis fork

**Both are optional for production.** They enable distribution to external users but aren't required for the product to function.
