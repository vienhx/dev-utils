# Proposal

## Why

Developers often turn a pasted list (one item per line) into a code literal: a JS/JSON array, a SQL `IN (...)` list, or a CSV row. Today this means hand-editing or a throwaway script. Chain already runs text through composable steps with templates, so a few list steps make these conversions one paste, and a saved template makes them one click.

## What Changes

- Add four steps to the Chain step picker:
  - **Remove duplicate lines** (`lines.dedupe`): keeps the first occurrence; options to trim lines and to ignore case.
  - **Quote lines** (`lines.quote`): adds text before and after each line (default `"` and `"`); escape option backslash (default), double, or none.
  - **Join lines** (`lines.join`): joins all lines into one using a separator (default `, `). Covers "compact to one line".
  - **Wrap** (`text.wrap`): adds open and close text around the whole input (default `[` and `]`).
- Add a **text option kind** for steps: a free-text field with a length cap, shown as a text input on the step card. Text options decode `\t`, `\n` and `\\`, so tabs and newlines can be used as separators or quotes.
- Line steps share one splitting rule: split on `\n` or `\r\n`, and a single trailing line break does not create an empty last line.

Out of scope: sort, split-to-lines, drop-empty-lines, and visible-whitespace rendering in text inputs.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `text-converters`: adds requirements for the line splitting rule and the four new steps.
- `pipeline-workspace`: adds requirements for free-text step options, their escape decoding, and fallback of invalid saved values.

## Docs to update

- `docs/features/chain.md` (updated): steps list in Implementation map, Before changing notes on text options.
- `docs/tech/architecture.md` (updated): code map rows for `src/steps/lines/` and `src/core/step.ts`, Add a step convention (option kinds now `select` / `number` / `text`), Decisions rows for list steps in Chain and for escape decoding of text options.
- `docs/overview.md` (updated): Product line mentions the list steps.

## Impact

- `src/core/step.ts` (new `TextField`, validation), `src/core/pipeline.ts` (decode text options before `run`), `src/core/registry.ts`.
- New `src/steps/lines/` with unit tests.
- `src/tools/chain/StepCard.svelte`: text input branch.
- Saved sessions and templates are unaffected; new options validate through the existing `resolveOptions` path.
- No new dependencies. Adds a small amount to the chain chunk, within the 30 KB budget.
