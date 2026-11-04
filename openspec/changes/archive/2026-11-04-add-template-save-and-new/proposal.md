# Proposal

## Why

Templates are quick presets, but once one is loaded the Chain tool forgets where the steps came from. To update a preset you have to retype its name in "Save as template" and confirm a replace. You also can't tell whether the chain still matches the preset, and there is no quick way to start over with an empty chain.

## What Changes

- The Chain tool remembers which template the current chain came from (the "linked" template). It keeps that link across reloads and never shows the template's name.
- New **Save** action: overwrites the linked template with the current steps, with no prompt. When no template is linked, it behaves like Save as.
- The existing "Save as template" becomes **Save as**: it asks for a name as before, then links the chain to the saved template.
- **BREAKING (behavior)**: saving under a name that already exists replaces that template without a confirmation dialog.
- New **Unsaved** marker: shown when the chain is linked to a template and its steps, options, or enabled states differ from that template. A chain with no linked template shows no marker.
- New **New** action: clears all steps and the template link and keeps the input. It shows no confirmation, only an Undo toast that restores the previous steps and link.
- Deleting the linked template removes the link without any notice. Renaming it keeps the link.
- The sidebar does not change.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `pipeline-templates`: the Save, Save as, and New actions, the linked template and its unsaved marker, and removal of the overwrite confirmation.

## Impact

- `src/tools/chain/Chain.svelte`: toolbar actions, unsaved marker, linked-template state.
- `src/storage/session.ts`: the session also stores the linked template id.
- `src/shell/templates.svelte.ts`: reactive read of one template by id. Save reuses the existing overwrite-by-name save, so no new storage functions are needed.
- e2e: `e2e/templates.spec.ts` and `e2e/fixtures.ts` (the overwrite flow no longer confirms; new actions).
- No new dependencies. Bundle impact is negligible.
