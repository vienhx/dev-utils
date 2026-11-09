# Proposal

## Why

The app has no way to find its source code. A visible link to the GitHub repository lets users read the code behind the no-tracking claim, report issues and contribute.

## What Changes

- Add a GitHub repository link pinned to the bottom of the sidebar, shown in every sidebar mode: icon and label in the full sidebar and mobile drawer, icon only (with an accessible name and tooltip) in the collapsed rail.
- The link opens the repository in a new tab and sends no referrer.
- Allow exactly the repository URL in the build's third-party URL scan, since it is a navigation link the app never fetches.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-navigation`: add a requirement that the sidebar links to the source repository in every sidebar mode.

## Docs to update

- `docs/tech/architecture.md` (updated): Decisions row for the source link and its dist-scan allowance; the `pnpm verify` line notes the allowed repository URL.

## Impact

- Code: `src/shell/Sidebar.svelte`, `src/shell/icons.ts`.
- Build checks: `scripts/check-dist.mjs` allowlist and `scripts/check-dist.test.ts`.
- Tests: `e2e/navigation.spec.ts`.
- No new dependencies; a few hundred bytes added to the initial bundle. CSP unchanged: following a link is navigation, not a runtime request.
