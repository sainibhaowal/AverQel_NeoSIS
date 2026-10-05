# Agent Note: Intel macOS leaves continuous integration

Status: implemented

English

## Problem

The `node24-macos-x64` runtime cell runs the installed-wheel black box, whose Office scenarios convert documents through the system LibreOffice. That cell reached Homebrew's cask installer for the engine and failed on every attempt: the documentfoundation mirror chain answers `403` for the Intel disk image, and a direct probe of `libreoffice/stable/<version>/mac/x86-64/LibreOffice_<version>_MacOS_x86-64.dmg` returns `404` for 24.8.7, 25.2.7, 25.8.4, 26.2.5, and 26.8.0, while the matching `aarch64` images return `200`. No Intel macOS disk image is published, so no retry, mirror, or checksum can obtain one and the cell spent hosted macOS minutes on a target whose Office path cannot execute.

## Decision

Continuous integration builds `node24-linux-arm64` and `node24-macos-arm64` for the post-merge Python runtime lane, and a blank `build-exe-for-python-sdk` dispatch covers `node24-linux-x64`, `node24-linux-arm64`, `node24-macos-arm64`, and `node24-win-x64`. The builder keeps `node24-macos-x64` selectable and the release workflow still publishes it, because the wheel is a product artifact for Intel macOS installations and removing that capability would drop a supported platform from the distribution rather than from the test matrix.

## Alternatives considered

**Keep retrying the Intel LibreOffice download** — rejected because the tested mirrors and versioned Intel URLs do not provide an image, so retries cannot make the Office scenarios executable.

**Remove Intel macOS from the release artifacts** — rejected because Intel users still need a runtime wheel even though the hosted Office test cannot run on that platform.

## Consequences

Each post-merge push builds one fewer native runtime and stops paying for the most expensive hosted runner tier on a target that cannot run its own assertions. A maintainer who needs an Intel macOS wheel dispatches the builder with `targets=node24-macos-x64`; that build produces the runtime but its Office scenarios remain unrunnable, so the receipt is the runtime build and smoke only. The `macos-15-intel` runner mapping, the GitLab release job, and the release workflow target list stay in place so a release remains reproducible without a workflow edit.
