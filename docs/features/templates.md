# Templates

**Related:** [pipeline-templates](../../openspec/specs/pipeline-templates/spec.md), [app-navigation](../../openspec/specs/app-navigation/spec.md), [chain](chain.md), [architecture](../tech/architecture.md#data-model)

Save a chain's steps (not its input) as a named [template](../overview.md#glossary), list it in the sidebar under its tool, and load it later.

## Entry points

| Trigger                                                | Who / gate                         | Input                                                    |
| ------------------------------------------------------ | ---------------------------------- | -------------------------------------------------------- |
| _Save_ / _Save as…_ in the Chain toolbar               | Anyone                             | Template name (Save as, or Save with no linked template) |
| _New_ in the Chain toolbar                             | Disabled when no steps and no link | None                                                     |
| Template link in the sidebar (`#/chain?template=<id>`) | Tools with `templates: true`       | Template id                                              |
| ⋯ menu on a sidebar template: Rename, Delete           | Anyone                             | New name / confirmation                                  |
| `storage` event from another tab                       | Browser                            | Changed templates key                                    |

## How it works

### Save as / Save

1. Save as: `askText` prompts for a non-blank name. Save with a linked template reuses its name; with none it runs Save as.
2. `templates.save(tool, name, steps, overwrite = true)` calls `saveTemplate`: it stores `{ type, options, enabled }` per step (deep copy). A name matching an existing one (trimmed, case-insensitive) replaces that template's steps, keeping its id and name.
3. On success, `templateId` links the chain to the template and a "Saved" toast shows. The reactive `templates` facade bumps its version so the sidebar re-reads.

**Outcome:** the template is in `devutils:v1:templates` and the chain is linked to it. On a failed write, an error toast says storage is full or blocked; nothing is linked.

### Load

1. A sidebar link sets the route to `#/chain?template=<id>`. `Chain.svelte` calls `loadTemplate` once, then `replaceRoute('chain')` so a reload doesn't load again.
2. `instantiate` makes fresh steps with new ids and re-validated options; it returns `null` if any step type is unknown.
3. The previous steps and link are snapshotted; steps are replaced, input is kept, the link is set.
4. A toast with Undo lasts 6 s; Undo restores the snapshot (one level).

**Outcome:** the chain matches the template and is linked to it. Later edits don't change the template until saved.

### New

1. `newChain` snapshots steps and link, clears both, keeps input, and shows a 6 s Undo toast.

### Unsaved marker

1. `linked` is the template for `templateId`, if it still exists and belongs to Chain (a deleted template counts as unlinked).
2. `unsaved` compares a JSON signature of `{ type, options, enabled }` per step between the chain and `instantiate(linked)`. Input is ignored.

### Rename / delete

1. `TemplateRow.svelte` uses `askText` / `askConfirm`, then `templates.rename` / `templates.remove`. Rename uses the same name rules but reports a duplicate instead of replacing.

## State and dependencies

- **Owns:** `devutils:v1:templates`; the link is `templateId` in the session ([data model](../tech/architecture.md#data-model)).
- **Uses:** the step registry (availability, option validation), shell dialogs, toasts and router.
- **Emits / consumes:** listens to `storage` events so other tabs' edits show in the sidebar.

## Important constraints

- Save, load, undo, rename, delete, duplicate names, unsaved marker, New, link persistence: [pipeline-templates](../../openspec/specs/pipeline-templates/spec.md).
- Templates nested under their tool and the template route: [app-navigation](../../openspec/specs/app-navigation/spec.md).

## Failures and limitations

- Template uses an unknown step type: shown as "unavailable" in the sidebar; loading it shows an error toast.
- Template id not found: "Template not found" toast.
- Unreadable stored items are hidden but kept, so writes never destroy them.
- Storage is per browser and origin; there is no export or import.

## Before changing

- Templates store step `type` ids; never rename an id without a migration.
- Always load through `instantiate` so the chain never shares objects with the stored template.
- Keep using the `templates` facade in UI code (not `storage/templates.ts` directly for writes) so the sidebar updates.

## Implementation map

| Responsibility                                 | Location                                                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Save, Save as, New, load, undo, unsaved marker | `src/tools/chain/Chain.svelte` `saveAs`, `save`, `newChain`, `loadTemplate`, `unsaved`                  |
| Storage, validation, name rules                | `src/storage/templates.ts` `saveTemplate`, `renameTemplate`, `deleteTemplate`, `instantiate`, `nameKey` |
| Reactive facade, cross-tab sync                | `src/shell/templates.svelte.ts` `templates`                                                             |
| Sidebar list and menu                          | `src/shell/Sidebar.svelte`, `src/shell/TemplateRow.svelte`                                              |
| Verification                                   | `src/storage/templates.test.ts`, `e2e/templates.spec.ts`                                                |
