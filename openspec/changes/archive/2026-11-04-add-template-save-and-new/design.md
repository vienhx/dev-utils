# Design

## Context

See proposal.md, "Why". Current state:

- `Chain.svelte` holds `steps` and `input`. `loadTemplate(id)` copies the template's steps in through `instantiate()`, then `replaceRoute` drops `?template=<id>` from the URL. After that nothing remembers the id.
- The session (`devutils:v1:session`) stores `{ input, steps }` and is written on a debounce by `createSessionSaver`.
- `saveTemplate(tool, name, steps, { overwrite })` already replaces a template that has the same name, keeping its id. `templates.svelte.ts` is a reactive facade: reads re-run whenever the `version` counter is bumped, including by `storage` events from other tabs.
- `instantiate()` resolves options through `resolveOptions`, which builds the options object in the step definition's key order. A resolved chain and a resolved template therefore serialize identically when they hold the same values.

## Goals / Non-Goals

**Goals:**
- Keep the link as a single template id in Chain state and in the session. Derive everything else from it: whether a template is linked, the unsaved marker, and what Save does.
- Reuse the existing save and toast code, with no new storage functions.

**Non-Goals:**
- Showing the linked template's name, or highlighting it in the sidebar.
- Tracking unsaved changes for chains with no linked template.
- Checking for unsaved changes before loading another template. The Undo toast covers that case.

## Decisions

1. **Link = `templateId` in Chain state and the session.** `Session` becomes `{ input, steps, templateId? }`. `loadSession` accepts `templateId` only when it is a string; anything else counts as absent. Old sessions without the field load unchanged, so no migration is needed. *Alternative:* keep the id in the URL (`#/chain?template=id`). Rejected because the URL is currently cleaned on purpose so a reload doesn't load the template again, and a link in the URL would leak into copied URLs.

2. **The linked template is derived, not stored.** `linked = templateId ? templates.get(templateId) : undefined`, read through the reactive facade, which gains a `get(id)` read that touches `version`. A deleted template, including one deleted in another tab, then counts as unlinked with no extra code, and a rename is picked up automatically. The stale id is left in state, which is harmless because ids are random UUIDs and never reused. The next Save as or New replaces it. *Alternative:* clear `templateId` in a delete handler. Rejected because it would miss deletes made in other tabs.

3. **Unsaved = signature comparison.** `dirty = linked && sig(steps) !== sig(instantiate(linked))`, where `sig` is `JSON.stringify` of `{ type, options, enabled }` for each step, in order. Step ids and input are left out. An unavailable template (`instantiate` returns null) counts as not dirty. *Alternative:* store a baseline snapshot at load time. Rejected because it can drift from storage after a save made in another tab, and it doubles the session state.

4. **Save reuses `templates.save` by name.** Save calls `templates.save(TOOL, linked.name, snapshot, true)`. The overwrite path finds the template by its current name and keeps its id. With no linked template, Save runs Save as. *Alternative:* a new `updateTemplateSteps(id, steps)`. Rejected because it duplicates the overwrite path. The trade-off is a theoretical race with a rename made in another tab during the same tick, which isn't worth guarding against.

5. **Save as overwrites without asking.** Save as calls `templates.save(..., true)` directly, and the `exists` branch and its `askConfirm` go away. On success it sets `templateId = r.template.id`, the existing id when a template was overwritten.

6. **New and Undo.** New snapshots `{ steps, templateId }`, then sets `steps = []` and `templateId = undefined`, and shows a toast for `UNDO_MS` with an Undo action that restores both. Load's existing Undo also restores the previous `templateId`. New is disabled when `steps.length === 0 && !linked`.

7. **Toolbar.** `[New] [Save] [Save as…]` sits where "Save as template" is now. An "Unsaved" text badge next to the step count, a dot plus text so color isn't the only signal, appears only when `dirty`. Save and Save as are disabled for an empty chain. Test ids: `new-chain`, `save`, `save-as` (replaces `save-template`), and `unsaved`.

## Risks / Trade-offs

- [Silent overwrite on Save as with a taken name could replace the wrong preset] → The user asked for no confirms. The success toast names the template that was saved.
- [New with no confirm could lose a chain] → The Undo toast is shown for 6 s.
- [Serializing to JSON on every change] → Chains are a handful of small steps, so the cost is negligible.

## Migration Plan

None needed. Sessions without `templateId` load as unlinked. Templates keep their storage format.
