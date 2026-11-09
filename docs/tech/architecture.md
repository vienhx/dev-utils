# Architecture

**Related:** [overview](../overview.md), [features/chain](../features/chain.md), [features/templates](../features/templates.md), [client-privacy](../../openspec/specs/client-privacy/spec.md)

Stack, source layout, storage, build checks and deployment for the whole app.

## Structure

Plain Vite + Svelte 5 + TypeScript SPA, built to static files in `dist/` and served by Vercel. No backend.

```
src/
  core/      pure TS, no Svelte: Value, step contract, evaluate(), step registry
  steps/     one folder per step family (json/, base64/, lines/), each step a StepDef
  storage/   versioned localStorage: session, templates, prefs
  shell/     app shell: tool registry, hash router, sidebar, dialogs, toasts
  tools/     one folder per tool, lazily loaded (chain/)
```

UI layers (`shell`, `tools`) depend on `core`, `steps` and `storage`, never the reverse.

## Code map

| Path                                                            | Responsibility                                                       | Key symbols                                                                                           |
| --------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/core/value.ts`                                             | Text/bytes value, strict UTF-8 helpers, binary display               | `Value`, `asText`, `asBytes`, `display`, `HEX_PREVIEW_LIMIT`                                          |
| `src/core/step.ts`                                              | Step contract, declarative options, escape decoding for text options | `StepDef`, `StepInstance`, `StepResult`, `TextField`, `resolveOptions`, `decodeEscapes`, `createStep` |
| `src/core/pipeline.ts`                                          | Runs input through the chain                                         | `evaluate`                                                                                            |
| `src/core/registry.ts`                                          | Every step, in picker order                                          | `steps`, `getStep`                                                                                    |
| `src/steps/json/`                                               | JSON steps on a lossless tokenizer                                   | `tokenizer.ts`, `jsonFormat`, `jsonCompact`, `jsonValidate`, `jsonEscape`, `jsonUnescape`             |
| `src/steps/base64/`                                             | Own Base64 codec and steps                                           | `codec.ts`, `base64Encode`, `base64Decode`                                                            |
| `src/steps/lines/`                                              | Line list steps and Wrap                                             | `splitLines`, `linesDedupe`, `linesQuote`, `linesJoin`, `textWrap`                                    |
| `src/storage/local.ts`                                          | Safe localStorage access                                             | `readJSON`, `writeJSON`                                                                               |
| `src/storage/session.ts`                                        | Chain session (input, steps, link)                                   | `loadSession`, `createSessionSaver`                                                                   |
| `src/storage/templates.ts`                                      | Template CRUD and validation                                         | `saveTemplate`, `listTemplates`, `instantiate`                                                        |
| `src/storage/prefs.ts`                                          | Sidebar prefs                                                        | `loadPrefs`, `savePrefs`                                                                              |
| `src/shell/tools.ts`                                            | Tool registry; drives sidebar, router, default route                 | `tools`, `defaultTool`, `getTool`                                                                     |
| `src/shell/router.ts`, `route.svelte.ts`                        | `#/<tool>?k=v` hash routes                                           | `parseHash`, `toolHash`, `route`, `replaceRoute`                                                      |
| `src/shell/Sidebar.svelte`, `TemplateRow.svelte`                | Sidebar, rail flyout, mobile drawer, template menu                   |                                                                                                       |
| `src/shell/*-state.svelte.ts`, `Dialogs.svelte`, `Toast.svelte` | Shared prompt/confirm dialogs and toasts                             | `askText`, `askConfirm`, `showToast`                                                                  |
| `src/tools/chain/`                                              | Chain tool UI                                                        | `Chain.svelte`, `StepCard.svelte`, `Picker.svelte`, `OutputBox.svelte`                                |
| `scripts/`                                                      | Build checks and local prod server                                   | `size.mjs`, `check-dist.mjs`, `serve.mjs`                                                             |
| `e2e/`                                                          | Playwright tests against the built app with prod headers             |                                                                                                       |

## Data model

Versioned `localStorage` keys holding JSON. Every read and write goes through `readJSON`/`writeJSON`, which never throw: corrupt or blocked storage reads as empty, failed writes return `false`.

| Key                     | Holds                                                                            | Owner                  |
| ----------------------- | -------------------------------------------------------------------------------- | ---------------------- |
| `devutils:v1:session`   | `{ input, steps: StepInstance[], templateId? }`, saved with a 300 ms debounce    | `storage/session.ts`   |
| `devutils:v1:templates` | `Template[]`: `{ id, tool, name, savedAt, steps: { type, options, enabled }[] }` | `storage/templates.ts` |
| `devutils:v1:prefs`     | `{ sidebarCollapsed, expandedTools: string[] }`                                  | `storage/prefs.ts`     |

- Stored options are always re-validated against the step's fields (`resolveOptions`); unknown keys and bad values fall back to defaults.
- A step `type` id (e.g. `json.format`) is stored in sessions and templates and must never be renamed without a storage migration.

## Conventions

- **Add a step:** one file in `src/steps/<family>/` exporting a `StepDef`, one entry in `steps` in `core/registry.ts`, unit tests next to it. Options are declarative (`select` / `number` / `text`), so no UI code is needed. A step returns `{ ok: false, error }` rather than throwing (`evaluate` also catches throws).
- **Add a tool:** one entry in `tools` in `shell/tools.ts` with a lazy `load()`; set `templates: true` to list its templates in the sidebar.
- Steps read input through `asText` / `asBytes` so UTF-8 handling stays in one place.
- Bundle, dependency and privacy rules: see `CLAUDE.md`.

## Build checks and deploy

- `pnpm verify` runs typecheck, lint, unit tests, build, `pnpm size` (budget in `scripts/size.mjs`) and `pnpm check:dist` (no inline scripts/styles, third-party URLs or tracker names in `dist/`; the only allowed external link is the source repository).
- `pnpm test:e2e` builds and serves `dist/` with the headers from `vercel.json`, so the real CSP is tested.
- Vercel deploys `master` to production; other branches get previews. CSP and security headers live in `vercel.json`.

## Decisions

| Area                 | Decision                                                                                                                   | Why                                                                                             | Rejected                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Framework            | Plain Vite + Svelte 5 SPA                                                                                                  | Static output with minimal config and runtime                                                   | SvelteKit + adapter-static: router and hydration not needed        |
| Values               | Steps pass `text` or `bytes`                                                                                               | Base64 decode of binary must be lossless                                                        | String-only steps                                                  |
| JSON                 | Hand-written lossless tokenizer                                                                                            | Keeps key order, big numbers, escapes; same line/column errors in every browser                 | `JSON.parse`/`stringify`                                           |
| JSON escape/unescape | Escape via `JSON.stringify`; unescape validates with the tokenizer, then decodes with `JSON.parse`                         | Exact JSON string semantics with positioned errors                                              | —                                                                  |
| List steps           | List operations (dedupe, quote, join) and Wrap are Chain steps; Wrap's id is `text.wrap` because it acts on the whole text | Composes with other steps, templates and session restore for free; a preset is a saved template | A separate Array tool; the id `lines.wrap`                         |
| Text options         | `evaluate` decodes `\t`, `\n`, `\\` in text options before `run`; sessions, templates and the card keep the typed form     | Steps always get real characters; `\t` stays readable in a one-line input                       | Decoding in each step; storing decoded values                      |
| Base64               | Own table-based codec                                                                                                      | Accepts mixed alphabets, whitespace, missing padding                                            | `btoa`/`atob` (Latin-1 only), `Uint8Array.fromBase64` (too strict) |
| Routing              | Hash router driven by the tool registry; tools lazily imported                                                             | No server routing needed; later tools don't grow the initial bundle                             | Router library                                                     |
| Storage              | Versioned localStorage keys, never-throwing access                                                                         | Survives blocked or full storage; `v1` allows a later migration                                 | —                                                                  |
| UI                   | Native `<dialog>`, popover, HTML5 drag and drop, container queries                                                         | No UI libraries within the bundle budget                                                        | Fuzzy-search and DnD libraries                                     |
| Fonts                | Inter and JetBrains Mono bundled via `@fontsource-variable`                                                                | Keeps `font-src 'self'`, no request to Google, works offline                                    | Google Fonts CDN                                                   |
| Security             | CSP as a response header in `vercel.json`                                                                                  | `frame-ancestors` only works as a header                                                        | `<meta>` CSP                                                       |
| Budget checks        | Own `size.mjs` and `check-dist.mjs` scripts                                                                                | A short script is enough                                                                        | `size-limit`                                                       |
| Source link          | GitHub link pinned to the bottom of `Sidebar`; icon only in the rail                                                       | Desktop has no header and every mode (full, rail, drawer) renders `Sidebar`                     | Icon in the brand row; a new desktop header                        |
| Dist scan allowlist  | `check-dist.mjs` allows exactly `https://github.com/vienhx/dev-utils`                                                      | It is a navigation link, never fetched; an exact match still catches any other GitHub URL       | Allowing all of `github.com`                                       |

## Risks

- Large inputs (several MB) run on the main thread and can lag; the 150 ms input debounce limits this. `core` is pure TS and could move to a Web Worker (needs `worker-src 'self'`).
- localStorage is per origin: preview deployments have separate data, and clearing site data removes templates.

## How to check

```sh
pnpm verify
pnpm test:e2e
```
