# Release Plan (Phase 8)

This is the final stage of the MVP project — launching the `munin` tool. Tasks focus exclusively on building, publishing, and announcing the product.

## Tasks

### 1. Final Build and package.json
Revise manifest fields (`package.json`):
- Add `bin` entrypoint (for CLI `munin` command resolution).
- Specify repository configuration, `keywords`, `author`.
- Bump version to `v0.1.0`.

### 2. CI/CD for Release
Extend `ci.yml` (GitHub Actions):
- After successful tests, build binary files (standalone `.exe`, Linux/macOS executables) via `bun build --compile`.
- Auto-publish: invoke `npm publish --access public` on release tag push `v*.*.*`, using `NODE_AUTH_TOKEN` secret.
- Build GitHub Release.

### 3. Marketing and Distribution
Announcement preparation:
- **`CHANGELOG.md`** — Initial changelog for `v0.1.0` with project capabilities.
- **`ANNOUNCEMENT.md`** — Draft texts for social media (Twitter, Reddit, Discord) and GitHub Releases, describing the benefits of an external memory bank for AI agents.

## Verification
Build a local Munin binary via compilation, runnable as a standalone utility without Bun:
`bun build src/cli/index.ts --compile --outfile munin`
