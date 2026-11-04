# Tasks

## 1. Project setup

- [x] 1.1 Scaffold a Vite + Svelte 5 + TypeScript (strict) app with pnpm, following the layout in design.md (`src/core`, `src/steps`, `src/storage`, `src/shell`, `src/tools`), and verify `pnpm dev` serves a blank page and `pnpm build` emits `dist/`
- [x] 1.2 Add `svelte-check`, ESLint, Prettier, and Vitest with `typecheck`, `lint`, and `test` scripts, set `pnpm.onlyBuiltDependencies: []` in `package.json`, and verify all three scripts pass on the scaffold and `pnpm install` runs no dependency install scripts
- [x] 1.3 Add self-hosted Inter and JetBrains Mono variable fonts (Latin subset), base CSS tokens, and light/dark theme, and verify the built `dist/` contains the font files and the page renders them

## 2. Core value and pipeline engine

- [x] 2.1 Implement the `Value` type with `asText` (fatal UTF-8), `asBytes`, and the hex preview helper, and verify unit tests cover valid and invalid UTF-8 plus the 256-byte preview cap
- [x] 2.2 Implement `StepDef` and `StepInstance` types, the step registry, and `evaluate(input, steps)` with ok/error/skipped/disabled results, and verify table-driven unit tests cover an empty chain, a disabled step pass-through, error-then-skip, and recovery

## 3. Converters

- [x] 3.1 Implement the lossless JSON tokenizer with line/column errors, and verify table-driven tests cover RFC 8259 edge cases and agree with `JSON.parse` on validity across a fixture corpus
- [x] 3.2 Implement the JSON validate, compact, and format steps (indent 2/4/tab), including byte input, and verify unit tests match every scenario in `specs/text-converters` (key order, large integers, UTF-8 errors)
- [x] 3.3 Implement the Base64 codec and the encode (standard / URL-safe) and decode steps, and verify unit tests match every Base64 scenario in `specs/text-converters` (Unicode, whitespace, mixed alphabet, invalid char, impossible length, empty input)
- [x] 3.4 Register all five steps with names and picker keywords (for example `b64`, `pretty`, `minify`), and verify a registry test asserts every step type is unique and has defaults that satisfy its option fields

## 4. Persistence

- [x] 4.1 Implement versioned session storage (`devutils:v1:session`) with debounced save and safe fallback on corrupt or unavailable storage, and verify unit tests cover save, restore, corrupt JSON, and a throwing `localStorage`
- [x] 4.2 Implement template storage with the `tool` field: save, overwrite by case-insensitive trimmed name within a tool, rename (reject duplicates), delete, list by tool newest first, mark unknown step types as unavailable, and deep-copy on load, and verify unit tests cover each `specs/pipeline-templates` scenario at the storage level
- [x] 4.3 Implement UI prefs storage (`devutils:v1:prefs`: sidebar collapsed, expanded tools) with a safe fallback, and verify unit tests cover save, restore, and corrupt data

## 5. App shell and navigation

- [x] 5.1 Implement the hash router (parse `#/<tool>?params`, `hashchange`, redirect empty or unknown routes to `#/chain`, `replaceState` helper), and verify table-driven unit tests cover root, known, unknown, and query-param routes
- [x] 5.2 Implement the tool registry with Chain as the default tool (lazy component) and the shell layout (sidebar + route outlet), and verify by hand that `#/chain` renders Chain and back/forward works
- [x] 5.3 Build the sidebar: tool list with active highlight, expandable template list per tool (newest first, empty hint, remembered expanded state), template links to `#/chain?template=<id>`, and a row menu with rename and delete (confirmation, duplicate-name rejection), and verify by hand against `specs/app-navigation` and the rename/delete scenarios in `specs/pipeline-templates`
- [x] 5.4 Build the desktop collapse to a 56 px icon rail (remembered across reloads) with a template flyout on hover or focus, and the mobile drawer under 768 px (menu button, backdrop, Escape, close on navigate), and verify by hand at 375 px and 1440 px
- [x] 5.5 Add keyboard and ARIA support to the sidebar (`aria-expanded` on collapse and section toggles, focus management in the drawer and flyout), and verify by hand by tabbing through the sidebar and opening a template with Enter

## 6. Chain tool UI

- [ ] 6.1 Build the Chain workspace layout (input, chain, output) as a size container with three columns at 1024 px of content width and wider, stacked below, and verify by hand at 375 px, 1100 px (stacked with the sidebar expanded), and 1440 px that there is no horizontal scroll
- [ ] 6.2 Build step cards with status badge, generic option controls, enable toggle, remove, up/down buttons, native drag and drop, and expandable peek, wired to live evaluation (150 ms input debounce), and verify by hand that the editing scenarios in `specs/pipeline-workspace` behave as described
- [ ] 6.3 Build the add-step control and the Ctrl/Cmd+K picker dialog with multi-word filtering and keyboard navigation, and verify by hand that typing `b64 dec` + Enter appends Base64 decode
- [ ] 6.4 Build the output box: read-only text, binary label with hex preview, error display, copy with toast, and swap to input, and verify by hand with `/9j/4A==` → [Base64 decode] that it shows "binary, 4 bytes" and `ff d8 ff e0`
- [ ] 6.5 Wire session restore on startup, and verify by hand that a reload restores the chain and input and the output recomputes
- [ ] 6.6 Add "Save as template" to the Chain toolbar (disabled for an empty chain, blank name rejected, overwrite confirmation, storage error message), and verify by hand that a saved template appears under Chain in the sidebar
- [ ] 6.7 Handle `?template=<id>` in Chain: load the template (keeping the input), snapshot the previous chain for a 6 s Undo toast, show "template not found" for unknown ids and an unavailable notice for templates with unknown steps, then `replaceState` to `#/chain`, and verify by hand that loading, Undo, and a reload after loading behave per `specs/pipeline-templates` and `specs/app-navigation`

## 7. Privacy, budget, and deploy checks

- [ ] 7.1 Add `vercel.json` with the CSP and security headers from design.md, and verify the deployed headers match the design when served by the 7.2 test server
- [ ] 7.2 Add a Playwright test server that serves `dist/` with the headers parsed from `vercel.json`, and verify a smoke test loads the page with zero CSP violations in the console
- [ ] 7.3 Add the `pnpm size` budget script (60 KB gzip initial JS+CSS, 30 KB per lazy tool chunk, based on the Vite manifest), and verify it passes on the current build and fails when a budget is temporarily set below the actual size
- [ ] 7.4 Add the `pnpm check:dist` scan (inline script/style, third-party URLs, tracker names), and verify it passes on the current build and fails on a fixture `dist/` that contains a third-party script tag
- [ ] 7.5 Add `pnpm verify` (typecheck, lint, test, build, size, check:dist), and verify it exits 0 on a clean checkout

## 8. End-to-end verification

- [ ] 8.1 Add Playwright tests for the main flows (build chain → output, error stops chain, reorder, peek, copy/swap, reload restore, template save, open from sidebar, Undo, rename/delete from the sidebar menu, `?template=` link, unknown route redirect), and verify `pnpm test:e2e` passes
- [ ] 8.2 Add Playwright privacy and layout tests: no requests after load while using the app, every page-load request is same-origin, a `fetch` from the page is blocked by CSP, the app works with the network offline after load, there is no horizontal scroll at 375 px, the mobile drawer opens and closes, the desktop rail collapse persists across reloads, and three columns show at 1440 px, and verify `pnpm test:e2e` passes
- [ ] 8.3 Run `pnpm verify` and `pnpm test:e2e` on the finished app, and verify both pass, including the bundle budget
- [ ] 8.4 Write README usage, local dev, test, and Vercel deploy instructions, and verify the documented commands run as written on a clean clone

## Workflow follow-up

- Link the repo to a Vercel project (preset Vite, `pnpm build`, output `dist`) and confirm the deployed response headers include the CSP.
- Archive the change after review.
