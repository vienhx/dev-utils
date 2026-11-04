# dev-utils Docs

Private, client-only developer utilities that run entirely in the browser.

Agents follow [RULES.md](RULES.md); it says where each kind of fact lives. Features and their docs are listed in [overview.md](overview.md#features).

## Index

Every doc and spec except feature docs, which the Features table in the overview lists.

| Doc                                                                | Covers                                                            | Code                                                        |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| [RULES.md](RULES.md)                                               | Rules for reading the docs                                        |                                                             |
| [WRITING.md](WRITING.md)                                           | Rules for writing and updating the docs                           |                                                             |
| [overview.md](overview.md)                                         | Product, goals, glossary, feature list, open questions            |                                                             |
| **Specs** (behaviour)                                              |                                                                   |                                                             |
| [pipeline-workspace](../openspec/specs/pipeline-workspace/spec.md) | Chain input, steps, live output, errors, session restore          | `src/tools/chain/`, `src/core/`                             |
| [text-converters](../openspec/specs/text-converters/spec.md)       | Built-in JSON and Base64 steps                                    | `src/steps/`                                                |
| [pipeline-templates](../openspec/specs/pipeline-templates/spec.md) | Saved chain templates                                             | `src/storage/templates.ts`, `src/shell/templates.svelte.ts` |
| [app-navigation](../openspec/specs/app-navigation/spec.md)         | Sidebar, mobile drawer, hash routes                               | `src/shell/`, `src/App.svelte`                              |
| [client-privacy](../openspec/specs/client-privacy/spec.md)         | No network, no tracking, CSP, offline                             | `vercel.json`, `scripts/`                                   |
| **Tech** (how it is built and why)                                 |                                                                   |                                                             |
| [tech/architecture.md](tech/architecture.md)                       | Stack, layout, code map, storage, build checks, deploy, decisions | `src/`, `scripts/`, `e2e/`                                  |
