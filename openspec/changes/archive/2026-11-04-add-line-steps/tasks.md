# Tasks

## 1. Text option kind

- [x] 1.1 Add `TextField` (`kind: 'text'`, `maxLength`) to `OptionField` in `src/core/step.ts`, and make `fieldAccepts` accept strings up to `maxLength`. Verify with unit tests in `src/core/` covering a valid string, an over-length string and a non-string, each falling back to the default via `resolveOptions`
- [x] 1.2 Add `decodeEscapes` to `src/core/step.ts` (`\t`, `\n`, `\\`, others kept, trailing `\` kept) and apply it to `text` fields in `runStep` in `src/core/pipeline.ts`. Verify with unit tests for each escape spec scenario, plus a pipeline test showing a step receives decoded text while `StepInstance.options` keeps the typed form
- [x] 1.3 Add a text input branch to `src/tools/chain/StepCard.svelte` (`type="text"`, `maxlength`, mono font, bound to the option). Verify with `pnpm typecheck` and `pnpm lint`
- [x] 1.4 Add a session test in `src/storage/session.test.ts`: a saved text option over 100 characters loads as the default. Verify with `pnpm test`
- [x] 1.5 Update `docs/tech/architecture.md`: code map row for `src/core/step.ts` (`TextField`, `decodeEscapes`), the Add a step convention listing the option kinds `select` / `number` / `text`, and a Decisions row for decoding escape sequences in the pipeline while storing the typed form. Verify by reading the doc back against design decisions 2 and 3

## 2. Line steps

- [x] 2.1 Create `src/steps/lines/` with `splitLines` and the `lines.dedupe`, `lines.quote`, `lines.join` and `text.wrap` step definitions (defaults, options, keywords per design decisions 4 and 5), reading input via `asText`. Verify with `pnpm typecheck`
- [x] 2.2 Register the four steps in `src/core/registry.ts` after the Base64 steps, in the order dedupe, quote, join, wrap. Verify with `src/core/registry.test.ts` (unique types, `getStep` lookups)
- [x] 2.3 Write `src/steps/lines/lines.test.ts` covering every scenario in the text-converters delta spec (line splitting, dedupe, quote, join, wrap, byte input), including the SQL IN list chain through `evaluate`. Verify with `pnpm test`
- [x] 2.4 Add an e2e test in `e2e/chain.spec.ts`: add Quote lines, Join lines and Wrap from the picker, paste three lines, and expect `["a", "b", "c"]`. Then change the separator to `\t` and expect the output to contain a tab. Verify with `pnpm test:e2e`
- [x] 2.5 Update docs: in `docs/tech/architecture.md`, add a code map row for `src/steps/lines/` and a Decisions row for list operations as Chain steps (with `text.wrap` naming). In `docs/features/chain.md`, update the Implementation map steps row and add a Before changing note that text options are stored as typed and decoded at run time. In `docs/overview.md`, mention the list steps in the Product line. Verify by reading the docs back against the code

## 3. Integration

- [x] 3.1 Run `pnpm verify`. Verify it passes, including `pnpm size` keeping the chain chunk within 30 KB gzip
- [x] 3.2 Run `openspec validate add-line-steps --strict`. Verify it passes

## Workflow follow-up

- Archive the change after review, which syncs the delta specs into `openspec/specs/`.
