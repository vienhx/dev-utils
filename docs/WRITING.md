# Writing Docs

How to write and keep the docs current. Read before changing any doc or spec; [RULES.md](RULES.md) says where each fact lives. This is a small project: keep docs short and only as detailed as an agent needs.

## One home

- Each fact has one authoritative home. Other docs may summarise it in a line and link to it; exact rules, values and contracts stay in the home.
- When a home changes, update the summaries that point at it in the same commit.
- A value held in a build or config file (`vercel.json`, `scripts/size.mjs`, `package.json`) lives in that file; docs point to it.
- Specs, feature docs and tech docs describe only what is built. An idea not yet started goes in `ideas/`; once work starts, its design and decisions live in the OpenSpec change until its code lands.

## Specs

- One spec per capability in `openspec/specs/<capability>/spec.md`. Build, toolchain and dependency facts are not capabilities; they go in tech docs.
- Each `### Requirement:` states one rule with SHALL or MUST and has at least one `#### Scenario:` written as WHEN/THEN. Normative words appear only in specs.
- Change specs only through an OpenSpec change (delta specs); archiving merges them. Never edit `openspec/specs/` directly.

## Feature docs

- One per feature with several steps, state changes or recovery. A simple capability can rely on its spec's Purpose plus a Code map row in a tech doc.
- Sections: Entry points, How it works (numbered steps ending in an **Outcome** line), State and dependencies, Important constraints (one line each, linking the spec), Failures and limitations, Before changing, Implementation map. Write "None" when a section doesn't apply.
- Name code by stable symbol in steps and by path in the implementation map. Never infer a guarantee from a symbol name alone.
- Domain terms live in the glossary in [overview.md](overview.md#glossary).

## Tech docs

- One per topic. The Code map lists the modules a reader needs, with paths and key symbols, not every file.
- The Decisions table holds the choices in force in the built code, with why and what was rejected. A decision enters it in the same commit as its code; a changed decision replaces its row.

## Code paths

- Exact file paths live only in implementation maps and code maps; other text names stable symbols. The index in [README.md](README.md) and the Features table in [overview.md](overview.md#features) name directories.

## Keeping docs current

- A change is finished when its specs and docs match the code. Doc updates go in the same commit as the code they describe.
- Update docs in place: replace the old rule, don't append history (no "was", "replaced", dated logs or done checkboxes).
- When a change ships, move what it built from `ideas/` into specs, feature and tech docs, and update the Features table in [overview.md](overview.md#features).
- When an open question is resolved, remove it from [overview.md](overview.md) and record the answer in its home.
- When adding a doc or spec, add it to the index in [README.md](README.md) (a feature doc: to the Features table).
- When deleting or moving a doc, spec or a code path that docs name, search `docs/`, `openspec/specs/` and `CLAUDE.md` for it and fix every link and path in the same commit.

## Writing for agents

- Keep each doc under about 8 KB. Prefer tables and bullets to prose.
- Open each doc with `**Related:**` links to its neighbours.
- Name code by path and stable symbol, never by line number.
- Test: from a feature doc and its direct links, an agent can explain the trigger, inputs, main flow, state changes, outcomes, dependencies, constraints, failures and code locations without searching the code.
