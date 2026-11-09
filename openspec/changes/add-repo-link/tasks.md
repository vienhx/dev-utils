# Tasks

## 1. Allow the repository URL in the dist scan

- [x] 1.1 Add an anchored `^https:\/\/github\.com\/vienhx\/dev-utils$` entry to `ALLOWED_URLS` in `scripts/check-dist.mjs` with a short comment that it is a navigation link, never fetched; verify with `pnpm test scripts/check-dist.test.ts`
- [x] 1.2 Add table cases to `scripts/check-dist.test.ts`: the exact repository URL passes, and another GitHub URL (e.g. `https://github.com/vienhx/dev-utils/raw/x.js`) is still reported; verify both cases pass
- [x] 1.3 In `docs/tech/architecture.md`, note in the `pnpm check:dist` line that the repository link is the one allowed URL, and add a Decisions row for the exact-match allowance (rejected: allowing all of `github.com`); verify by reading back

## 2. Sidebar source link

- [x] 2.1 Add the Feather outline `github` path to `icons` in `src/shell/icons.ts`; verify with `pnpm typecheck`
- [x] 2.2 In `src/shell/Sidebar.svelte`, add a footer link to `https://github.com/vienhx/dev-utils` after the tool list, pinned with `margin-top: auto` and a top border, `target="_blank" rel="noopener noreferrer"`: icon plus "GitHub" label styled like a tool row in `full`/`drawer`, icon-only 40×40 with `aria-label="GitHub repository"` and `title` in `rail`; verify visually at 1440 px (expanded and collapsed) and 375 px (drawer)
- [x] 2.3 Add e2e tests to `e2e/navigation.spec.ts` covering the spec scenarios: link visible with the right `href`, `target` and `rel` in the expanded sidebar, the collapsed rail (by accessible name "GitHub repository") and the mobile drawer; verify with `pnpm test:e2e e2e/navigation.spec.ts`
- [x] 2.4 In `docs/tech/architecture.md`, add a Decisions row for the sidebar footer placement (rejected: brand-row icon, new desktop header); verify by reading back

## 3. Integration

- [x] 3.1 Run `pnpm verify` (typecheck, lint, unit tests, build, bundle budget, dist scan) and the full `pnpm test:e2e`; verify both pass

## Workflow follow-up

- Archive with `openspec archive add-repo-link` after review so the delta merges into `openspec/specs/app-navigation/spec.md`.
