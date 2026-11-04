# Overview

**Related:** [README](README.md), [architecture](tech/architecture.md)

## Product

dev-utils is a private set of developer utilities that runs entirely in the browser. It has no backend and no tracking, and the CSP blocks all runtime network requests, so pasted data never leaves the page. It is deployed as static files to Vercel.

The only tool today is **Chain**: the user pastes text, builds an ordered chain of transform steps (JSON, Base64), and sees the output live. Chains can be saved as templates.

## Goals

- Fast and small: initial load within the bundle budget in `CLAUDE.md`.
- Private: all processing and storage stay in the browser.
- **Non-goals:** a backend, accounts, sync across devices, template export or import.

## Glossary

| Term            | Meaning                                                                                    | Home doc                                                           |
| --------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Tool            | A top-level page in the sidebar (today only Chain)                                         | [app-navigation](../openspec/specs/app-navigation/spec.md)         |
| Chain           | The ordered list of steps the input runs through                                           | [pipeline-workspace](../openspec/specs/pipeline-workspace/spec.md) |
| Step            | One transform (e.g. JSON format) with options and an enabled flag; its `type` id is stable | [text-converters](../openspec/specs/text-converters/spec.md)       |
| Value           | Data passed between steps: text or bytes                                                   | [pipeline-workspace](../openspec/specs/pipeline-workspace/spec.md) |
| Template        | A named, saved chain (steps only, no input) belonging to a tool                            | [pipeline-templates](../openspec/specs/pipeline-templates/spec.md) |
| Linked template | The template the current chain was loaded from or saved as                                 | [pipeline-templates](../openspec/specs/pipeline-templates/spec.md) |

## Features

| Feature    | What it does today                                                                        | Docs                                                                                                                                        | Code                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Chain      | Input → ordered steps → live output, with per-step status, peek, copy and session restore | [feature](features/chain.md), [spec](../openspec/specs/pipeline-workspace/spec.md), [steps spec](../openspec/specs/text-converters/spec.md) | `src/tools/chain/`, `src/core/`, `src/steps/`                                               |
| Templates  | Save, save as, load with undo, new, rename, delete; unsaved marker                        | [feature](features/templates.md), [spec](../openspec/specs/pipeline-templates/spec.md)                                                      | `src/storage/templates.ts`, `src/shell/templates.svelte.ts`, `src/shell/TemplateRow.svelte` |
| Navigation | Sidebar (collapsible rail on desktop, drawer on mobile) and `#/<tool>` routes             | [spec](../openspec/specs/app-navigation/spec.md), [code map](tech/architecture.md#code-map)                                                 | `src/shell/`, `src/App.svelte`                                                              |
| Privacy    | No network or tracking, enforced by CSP and build checks                                  | [spec](../openspec/specs/client-privacy/spec.md), [build checks](tech/architecture.md#build-checks-and-deploy)                              | `vercel.json`, `scripts/`                                                                   |

## Open questions

- **Specs lack `Related:` and `Tests:` lines.** The five specs in `openspec/specs/` have no Tests line naming their unit and e2e files. Add them through the next OpenSpec change that touches each spec.
