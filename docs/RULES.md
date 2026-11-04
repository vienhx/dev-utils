# Docs Rules

Rules for every agent working in this repository.

## Reading

- Find your starting doc: a feature in the Features table of [overview.md](overview.md#features), by name or by the directory you are changing; anything else in the index in [README.md](README.md), by its Code column.
- Read the feature doc first. Follow a link only to answer a question it leaves open: specs for exact behaviour, tech docs for how it is built and why. Stop when you can explain the trigger, inputs, main flow, state changes, outcomes, dependencies, constraints, failures and the code that owns them.
- For implementation work, read the mapped code and tests the change touches. Links are starting points, not limits; read code to resolve uncertainty or check a conflict.
- Before writing or changing any doc or spec, read [WRITING.md](WRITING.md).
- Before finishing a code change, check whether behaviour, flows, decisions or documented code locations changed. If so, read [WRITING.md](WRITING.md) and update the affected docs.

## Source of truth

Each kind of fact has one authoritative home:

| Fact                                                                                                | Home                                                                                                               |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Behaviour: what the system must do, testable                                                        | Specs: `openspec/specs/<capability>/spec.md`                                                                       |
| How it is built and why: architecture, code map, storage, conventions, decisions, build, deployment | `tech/<topic>.md`                                                                                                  |
| How a feature works end to end: entry points, flow, failures, where the code is                     | `features/<feature>.md`                                                                                            |
| Design not built yet                                                                                | `ideas/<area>.md` (the first record of an idea), or an open OpenSpec change (once work starts, with its decisions) |
| Product, goals, glossary, feature list, open questions                                              | [overview.md](overview.md)                                                                                         |

- Docs hold the current state only. Git keeps the history.
- If code and docs disagree, raise the conflict; don't silently follow either.
