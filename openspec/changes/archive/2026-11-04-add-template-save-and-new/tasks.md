# Tasks

## 1. Linked template in session and state

- [x] 1.1 Add optional `templateId` to `Session` in `src/storage/session.ts`: `saveSession` writes it, and `loadSession` keeps it only when it is a string. Verify with new cases in `src/storage/session.test.ts` (round-trip, missing field, non-string value).
- [x] 1.2 Add `get(id)` to the reactive facade in `src/shell/templates.svelte.ts`, reading `version` so it re-runs after saves, deletes, and `storage` events. Verify with `pnpm typecheck`.
- [x] 1.3 In `Chain.svelte`, hold `templateId` restored from the session, save it with the session, derive `linked` from `templates.get`, and set the id on load. Make load's Undo restore the previous id. Verify with an e2e test: load a template, reload, then Save updates that template ("Link survives reload").

## 2. Save, Save as, New, and the unsaved marker

- [x] 2.1 Replace the "Save as template" button with Save and Save as (test ids `save`, `save-as`). Save as overwrites an existing name without a confirm and links to the saved template. Save overwrites the linked template by its current name, and with no link it runs Save as. Drop the now-unused `askConfirm` import. Verify by updating `e2e/fixtures.ts` (`saveTemplate` uses `save-as`, and the comment no longer mentions confirmation), `e2e/layout.spec.ts`, and `e2e/templates.spec.ts` ("overwrite asks for confirmation" becomes "overwrite without confirmation"), and by adding e2e cases for "Save updates linked template", "Save without linked template", "Linked template renamed", and "Linked template deleted".
- [x] 2.2 Add the unsaved marker (test id `unsaved`): shown only when a template is linked and the step signature (type, options, enabled, in order) differs from the instantiated template. Verify with e2e cases for "Edit shows marker", "Save clears marker", "Reverting clears marker", "Input does not count", and "No linked template".
- [x] 2.3 Add the New button (test id `new-chain`): clears steps and `templateId`, keeps the input, and shows an Undo toast for `UNDO_MS` that restores both. Disabled when there are no steps and no link. Verify with e2e cases for "New clears steps", "Undo New", and "Empty chain".
- [x] 2.4 Check the "storage failure on save" e2e test still passes for Save as, and add the same check for Save (the chain and link are unchanged after the error).

## 3. Integration

- [x] 3.1 Run `pnpm verify` (typecheck, lint, unit tests, build, bundle budget, dist scan) and the e2e suite. Both pass, and the Chain chunk stays within budget.
- [x] 3.2 Run `openspec validate add-template-save-and-new --strict` and verify it passes.

## Workflow follow-up

- Archive the change after review, which syncs the `pipeline-templates` delta into the main spec.
