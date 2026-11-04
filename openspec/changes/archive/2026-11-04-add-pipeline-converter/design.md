# Design

## Context

The repository is empty apart from a README and OpenSpec. Motivation and scope are in proposal.md, and the behavior contract is in the four specs. This design covers the constraints that shape the build: a static deploy on Vercel, no runtime network access (`client-privacy`), fast first load on mobile, and a step model that can grow beyond text-only transforms.

## Goals / Non-Goals

**Goals:**
- First load under about 60 KB of JS+CSS (gzip), excluding fonts. Interactive immediately, with no loading spinner.
- Adding a new step means one new file plus a registry entry, with no changes to the UI or the pipeline engine.
- The step and pipeline logic is pure TypeScript, testable without a browser.

**Non-Goals:**
- Service worker or PWA install. The page already works offline once loaded. A full PWA can be added later.
- Sharing a pipeline via URL, and template import/export.
- Running steps in a Web Worker. v1 runs on the main thread (see Risks).
- File upload or download for binary input or output.
- Built-in preset templates.

## Decisions

### 1. Plain Vite + Svelte 5 SPA, not SvelteKit
A single page with no routing, SSR, or server code. Plain Vite builds static files into `dist/` with less config and runtime than SvelteKit plus a static adapter.
- *Alternative:* SvelteKit with `adapter-static`. Rejected because it adds a router and hydration that this page doesn't need.

### 2. Layered source layout
```
src/
  core/           pure TS, no Svelte imports
    value.ts      Value type, UTF-8 helpers, hex preview
    step.ts       StepDef / StepInstance types, StepResult
    pipeline.ts   evaluate(input, steps) -> results[]
    registry.ts   list of all StepDefs (catalog)
  steps/
    json/         tokenizer.ts, validate.ts, compact.ts, format.ts
    base64/       codec.ts, encode.ts, decode.ts
  storage/        session.ts, templates.ts, prefs.ts (versioned localStorage)
  shell/          App shell: router.ts, tools.ts (tool registry), Sidebar, Drawer, Toast
  tools/
    chain/        Chain tool UI (Workspace, StepCard, Picker, OutputBox...)
  app.css, main.ts
```
The UI layers (`shell`, `tools`) depend on `core`, `steps`, and `storage`, never the reverse. This keeps the logic unit-testable and makes a later move to a worker a matter of moving files.

### 3. Typed values and the step contract
```ts
type Value = { kind: 'text'; text: string } | { kind: 'bytes'; bytes: Uint8Array };

interface StepDef<O> {
  type: string;            // stable id, e.g. 'json.format' (stored in templates)
  name: string;            // "JSON format"
  keywords: string[];      // picker search terms, e.g. ['pretty', 'beautify']
  defaults: O;
  options: OptionField[];  // declarative: select / number, rendered generically
  run(input: Value, opts: O): StepOutcome;   // { ok: true, value } | { ok: false, error }
}
```
- Each step converts its input to what it needs through shared helpers: `asText(value)`, which decodes UTF-8 with `TextDecoder('utf-8', { fatal: true })`, and `asBytes(value)`, which uses `TextEncoder`. This is how the spec's UTF-8 rules are met in one place.
- Options are declarative, so the step card renders them without step-specific UI code.
- `type` ids are stable and stored in templates. Renaming an id later requires a storage migration.
- *Alternative:* string-only steps. Rejected because Base64 decode of binary data would be lossy, and future steps like hash or gzip need bytes.

### 4. Pipeline evaluation
`evaluate(input, steps)` walks the chain and returns one result per step: `ok(value)`, `error(message)`, `skipped`, or `disabled`. Disabled steps forward their input unchanged. After the first error, later steps are `skipped`. The UI keeps a `$state` chain and input, debounces input changes by 150 ms (option and chain edits recompute immediately), and derives results. Peek displays the stored per-step value, so expanding a step costs nothing extra.

### 5. JSON steps use a lossless tokenizer, not `JSON.parse`
A small hand-written JSON tokenizer and validator (about 200 lines) checks the grammar and records line and column. Compact and format re-emit the token stream with new whitespace.
- This preserves key order. `JSON.parse` moves integer-like keys (such as `"2"`) to the front.
- It preserves big numbers and original string escapes, since token text is copied verbatim.
- It gives the same line and column error text in every browser. Native error messages differ between engines, and Safari's have no position.
- Validate runs the same tokenizer and returns the input unchanged.
- *Alternative:* `JSON.parse` + `JSON.stringify`. Rejected because it breaks key order and precision, and its errors vary by browser.

### 6. Own Base64 codec
A small table-based codec (about 60 lines). Decode removes whitespace, accepts `+/` and `-_` in the same input, tolerates missing padding, and rejects other characters and a final group of length 1. Encode supports standard (padded) and URL-safe (unpadded) output.
- *Alternative:* `btoa`/`atob`. Rejected because they are Latin-1 only, strict, and string-based. Native `Uint8Array.fromBase64` is also too strict about mixed alphabets and whitespace to meet the spec.

### 7. Persistence
Versioned `localStorage` keys hold JSON, and every read and write is wrapped in try/catch:
- `devutils:v1:session` = `{ input, steps: StepInstance[] }`, saved with a 300 ms debounce.
- `devutils:v1:templates` = `Template[]`, where `Template = { id, tool: 'chain', name, savedAt, steps: { type, options, enabled }[] }`. The `tool` field puts each template under the right sidebar entry. Name uniqueness is checked within a tool.
- `devutils:v1:prefs` = `{ sidebarCollapsed, expandedTools: string[] }`.
- On load, each template is validated on its own. A template whose `type` is not in the registry is marked unavailable, as the spec requires. A corrupt key falls back to empty.
- Name uniqueness compares `name.trim().toLowerCase()`.
- Loading a template deep-copies its steps (`structuredClone`) and gives them new instance ids, so editing the chain never changes the template.

### 8. UI interactions
- **Step picker:** a Ctrl/Cmd+K dialog using a native `<dialog>` element, with a simple filter over `name + keywords`. Every typed word must be a substring, so `b64 dec` matches "Base64 decode" through its keyword `b64`. No fuzzy-search library.
- **Reorder:** up/down buttons on every card (keyboard- and touch-friendly), plus native HTML5 drag and drop on pointer devices. No DnD library. Native DnD doesn't work on touch, so mobile relies on the buttons.
- **Byte output display:** shown as text if it decodes as UTF-8. Otherwise a "binary, N bytes" label plus the hex of the first 256 bytes.
- **Copy:** `navigator.clipboard.writeText`, with a 1.5 s "Copied" toast.
- **Layout:** the Chain workspace is a CSS size container (`container-type: inline-size`). An `@container (min-width: 1024px)` rule switches it to three columns, so the breakpoint follows the content width whether the sidebar is expanded, collapsed, or hidden. Text areas grow vertically, and the page never scrolls horizontally.
- **Undo after template load:** before loading, the previous chain is snapshotted. A toast with Undo stays for 6 s, and Undo restores the snapshot. Only one level of undo is kept.
- **Theme:** system light/dark through `prefers-color-scheme`, using CSS custom properties.

### 9. App shell, tool registry, and hash router
```
+----------------------------------------------------------+
| Shell                                                    |
| +-----------+  +---------------------------------------+ |
| | Sidebar   |  | <route outlet>                        | |
| |  tools[]  |  |   tools.find(id).component            | |
| |   templ.  |  |   (Chain workspace)                   | |
| +-----------+  +---------------------------------------+ |
+----------------------------------------------------------+
   ^ reads tools.ts + templates store      ^ router.ts ($state route)
```
- **Tool registry** (`shell/tools.ts`): `{ id: 'chain', name: 'Chain', icon, component, templates: true }[]`. The sidebar, router, and default route are all driven from this list, so adding tool #2 means adding one entry. Each tool's component is imported lazily (`() => import(...)`) so later tools don't grow the first-load bundle. Chain is prefetched because it is the default.
- **Router** (`shell/router.ts`): about 40 lines. It parses `location.hash` into `{ tool, params }`, listens for `hashchange`, and exposes the route as Svelte `$state`. Unknown or empty routes redirect to `#/chain` with `history.replaceState`. `?template=<id>` is handled by the Chain tool on mount: it loads the template, then calls `replaceState` to `#/chain`, so reloading doesn't load it again.
- **Sidebar clicks** use real `<a href="#/chain?template=<id>">` links, so middle-click and keyboard work natively. Loading inside the tool always runs through the same code path, whichever way the route was reached.
- **Responsive shell:** at 768 px and wider, a fixed-width sidebar (240 px, or a 56 px rail when collapsed) sits next to the content. Below 768 px it becomes a `<dialog>`-based drawer with a backdrop, closed by Escape, a backdrop tap, or a navigation. The rail flyout is a popover anchored to the tool icon and opens on hover or focus.
- *Alternative:* a router library such as `svelte-spa-router`. Rejected because it adds weight for two route shapes.
- *Alternative:* path-based routes (`/chain`). Rejected because they need a Vercel SPA rewrite, and path segments reach the server logs, while the hash never leaves the browser.

### 10. Fonts: Google Fonts families, self-hosted
Inter (UI) and JetBrains Mono (text boxes) come from Google Fonts but are bundled through `@fontsource-variable/*`, so they are served from our own origin. This keeps `font-src 'self'`, avoids a request to Google on every visit, and works offline. Only the Latin subset is imported, with `font-display: swap`.
- *Alternative:* the Google Fonts CDN link. It is acceptable to the user, but it would need CSP exceptions and would reveal visitor IPs to Google. It was rejected because it conflicts with the `client-privacy` spec.

### 11. Security headers in `vercel.json`
```
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self';
  img-src 'self' data:; font-src 'self'; connect-src 'none'; manifest-src 'self';
  base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
```
- The policy is a response header, not a `<meta>` tag, because `frame-ancestors` only works as a header. Vite dev mode (HMR uses WebSocket) is unaffected because it doesn't use `vercel.json`.
- The build must not emit inline scripts or styles. Vite's production build doesn't by default. Svelte 5 component CSS is extracted to files, and `style:` directives set properties through the CSSOM, which CSP allows.
- No Vercel Analytics or Speed Insights packages are installed.

### 12. Bundle budget and dependency policy
The rules in `CLAUDE.md` are enforced by scripts rather than by review alone:
- **`pnpm size`**: a small Node script that gzips the built `dist/` assets. It fails if the entry chunk plus its static imports (JS+CSS) exceed 60 KB, or if any lazily loaded tool chunk exceeds 30 KB. It reads Vite's build manifest to tell initial chunks from lazy ones. No size-limit library is used.
- **`pnpm check:dist`**: scans `dist/` for inline `<script>`/`<style>`, `http(s)://` URLs to other origins, and known tracker names (`gtag`, `analytics`, `sentry`, `segment`, `mixpanel`, `posthog`, `vercel/insights`). Any hit fails the check.
- **Install scripts**: pnpm 10 blocks dependency install scripts by default. `package.json` sets `pnpm.onlyBuiltDependencies: []`, so allowing one is a visible, reviewable change.
- **`pnpm verify`**: runs typecheck, lint, unit tests, build, size, and check:dist in sequence. It is the single local and CI gate.
- The runtime dependencies at the start are only `svelte` and the two `@fontsource-variable` packages. Everything else is a dev dependency.
- *Alternative:* `size-limit`. Rejected because it pulls in a large dev toolchain for what a short script can check.

### 13. Tooling
pnpm, TypeScript strict mode, `svelte-check`, ESLint + Prettier, and Vitest for `core`, `steps`, and `storage`. Playwright handles end-to-end UI, layout, and CSP checks. Its test server serves `dist/` with the headers read from `vercel.json`, so the CSP tested is the CSP deployed.

## Risks / Trade-offs

- [Large inputs (several MB) can make typing lag on the main thread.] → The input debounce limits how often the chain runs. The pure `core` layer can move to a Web Worker later without UI changes. That would need `worker-src 'self'` in the CSP.
- [The hand-written JSON tokenizer could diverge from the JSON spec.] → Table-driven tests cover RFC 8259 edge cases (escapes, surrogates, exponents, leading zeros, trailing commas, deep nesting). Validity is cross-checked against `JSON.parse` on a fixture corpus.
- [A strict CSP could break the production build if a dependency injects inline styles or scripts.] → A Playwright test loads the built site with the real headers and fails on any CSP violation in the console.
- [`localStorage` is per-origin. Preview deployments get separate storage, and clearing site data wipes templates.] → Accepted for v1. Template export/import is a listed non-goal and a candidate follow-up.
- [A step `type` id renamed later would orphan saved templates.] → Ids are treated as permanent. The storage key is versioned (`v1`) so a migration can run if one is ever needed.

## Migration Plan

This is a greenfield deploy. Create a Vercel project linked to the repo with framework preset "Vite", build command `pnpm build`, and output directory `dist`. Preview deploys come from branches and production from `master`. Rollback uses Vercel's "promote previous deployment". No data migration is needed because all state lives in each user's browser.
