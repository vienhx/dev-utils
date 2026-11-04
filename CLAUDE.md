# dev-utils

Client-only developer utilities (Svelte 5 + Vite + TypeScript), deployed as static files to Vercel. No backend, no tracking.

## Bundle & dependencies

- Fast and small first. Initial load budget: <= 60 KB gzip JS+CSS (fonts excluded). Each lazily loaded tool chunk: <= 30 KB gzip. `pnpm size` fails over budget.
- Prefer the platform: TextEncoder/Decoder, `<dialog>`, popover, container queries, Intl, structuredClone, etc. before reaching for a library.
- Add a third-party runtime library only when it is really needed: no platform API covers it AND writing it ourselves would be large or risky (e.g. crypto, complex format parsers). Record why in the PR description, with its gzip size cost.
- Every library (runtime or dev) MUST:
  - make no network requests, and contain no telemetry, analytics, tracing, error reporting, or "phone home" code, including install scripts
  - be ESM and tree-shakeable (runtime libs)
  - use a permissive license (MIT, Apache-2.0, BSD, ISC)
- Never add: analytics/telemetry SDKs, error trackers (e.g. Sentry), Vercel Analytics / Speed Insights, or CDN-hosted scripts, styles, or fonts.
- Keep pnpm's `onlyBuiltDependencies` allowlist empty unless a package's install script has been reviewed and does no network access.
- All assets are self-hosted. The production CSP forbids runtime network access; never loosen it to make a library work.

## Checks

Run `pnpm verify` (typecheck, lint, unit tests, build, bundle budget, dist scan) before reporting work as done.
