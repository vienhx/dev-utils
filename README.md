# dev-utils

Private, client-only developer utilities. Everything runs in your browser. There is no backend, no analytics, and a strict Content Security Policy blocks every runtime network request, so pasted data never leaves the page.

## Using it

The first tool is **Chain**. Paste text into **Input**, add steps, and read the result in **Output**. The output updates as you type.

- **Add a step** with the _Add step_ button, or press <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>K</kbd> and type part of its name (for example `b64 dec` or `pretty`), then press <kbd>Enter</kbd>.
- **Built-in steps:** JSON format (2 spaces, 4 spaces, or tab), JSON compact, JSON validate, JSON escape (quotes included or omitted), JSON unescape, Base64 encode (standard or URL-safe), and Base64 decode.
- **Edit the chain:** reorder with the arrow buttons or by dragging the handle, turn a step off with _Enabled_, remove it with ✕, and click the eye icon to peek at that step's output.
- **Errors:** a failing step shows its error, later steps are marked _skipped_, and the output shows the error.
- **Binary output** that isn't valid UTF-8 is shown as `binary, N bytes` with a hex preview.
- **Copy** puts the output on the clipboard. **Use as input** moves the output into the input box.
- **Templates:** _Save as template_ stores the current steps (not the input) under Chain in the sidebar. Click one to load it, and use _Undo_ in the notice to go back. Rename or delete a template from its ⋯ menu.

Your input, chain, templates, and sidebar layout are kept in this browser's `localStorage`. Clearing site data removes them.

## Local development

Requirements: Node.js 22 or newer and pnpm 10 (`corepack enable` or `mise use pnpm@10`).

```sh
pnpm install
pnpm dev        # http://localhost:5173
```

Other commands:

| Command           | What it does                                                                    |
| ----------------- | ------------------------------------------------------------------------------- |
| `pnpm build`      | Production build to `dist/`                                                     |
| `pnpm serve`      | Serves `dist/` on http://127.0.0.1:4173 with the headers from `vercel.json`     |
| `pnpm typecheck`  | `svelte-check` and `tsc` for the Node scripts and tests                         |
| `pnpm lint`       | ESLint and Prettier check (`pnpm format` fixes formatting)                      |
| `pnpm test`       | Unit tests (Vitest)                                                             |
| `pnpm size`       | Fails if initial JS+CSS exceeds 60 KB gzip or a lazy tool chunk exceeds 30 KB   |
| `pnpm check:dist` | Fails on inline scripts or styles, third-party URLs, or tracker code in `dist/` |
| `pnpm verify`     | All of the above in order: the gate to pass before pushing                      |

## End-to-end tests

The Playwright tests build the app and serve it with the production headers, so they run under the real CSP.

```sh
pnpm exec playwright install chromium   # once
pnpm test:e2e
```

## Deploying to Vercel

1. Import the repository in Vercel. `vercel.json` sets the framework (Vite), the build command (`pnpm build`), the output directory (`dist`), and the security headers.
2. Production deploys from `master`. Other branches get preview deployments.
3. After the first deploy, confirm the CSP is live:

   ```sh
   curl -sI https://<your-deployment>.vercel.app/ | grep -i content-security-policy
   ```

To roll back, promote a previous deployment in the Vercel dashboard. There is no server-side data to migrate.

## Project rules

See [CLAUDE.md](CLAUDE.md) for the bundle budget and dependency policy: no telemetry, self-hosted assets only, and the CSP is never loosened to fit a library.
