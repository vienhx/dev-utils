# Spec Delta

## MODIFIED Requirements

### Requirement: Save chain as template
From the Chain tool, the user SHALL be able to save the current chain as a named template belonging to Chain, using a Save as action. A template SHALL store the ordered steps with their options and enabled states. It SHALL NOT store the input text. After a successful Save as, the chain SHALL be linked to the saved template.

#### Scenario: Save new template
- **WHEN** the chain is [Base64 decode, JSON format (indent 4)] and the user saves it as `B64 to JSON`
- **THEN** a template named `B64 to JSON` appears under Chain in the sidebar, with those two steps and options

#### Scenario: Input not stored
- **WHEN** the user saves a template while the input box contains text
- **THEN** loading that template later does not change the input box

#### Scenario: Empty or blank name
- **WHEN** the user tries to save a template with an empty or whitespace-only name
- **THEN** the template is not saved and the user is asked for a name

#### Scenario: Empty chain
- **WHEN** the chain has no steps
- **THEN** the Save and Save as actions are unavailable

#### Scenario: Save as links the chain
- **WHEN** the user saves the chain as `B64 to JSON`, then changes a step option and uses Save
- **THEN** `B64 to JSON` is updated with the changed option and no name is asked for

### Requirement: Load template
Loading a template SHALL replace the current chain with a copy of the template's steps, SHALL keep the current input text, and SHALL link the chain to that template. Later edits to the chain SHALL NOT change the saved template until the user saves.

#### Scenario: Load replaces chain
- **WHEN** the chain is [Base64 encode], the input is `{"a":1}`, and the user loads `B64 to JSON`
- **THEN** the chain becomes [Base64 decode, JSON format (indent 4)], the input is still `{"a":1}`, and the output recomputes

#### Scenario: Editing after load
- **WHEN** the user loads a template and then removes a step from the chain
- **THEN** the saved template still contains all of its steps

### Requirement: Undo template load
After a template is loaded, the app SHALL show a notice with an Undo action for at least 5 seconds. Undo SHALL restore the chain, and its template link, that were there before the load.

#### Scenario: Undo restores previous chain
- **WHEN** the chain is [Base64 encode], the user loads `B64 to JSON`, and then clicks Undo
- **THEN** the chain is [Base64 encode] again and the output recomputes

#### Scenario: Notice expires
- **WHEN** the user loads a template and does not click Undo
- **THEN** the notice disappears and the loaded chain stays

## REMOVED Requirements

### Requirement: Overwrite on duplicate name
**Reason**: Templates are quick presets, so replacing one under a taken name no longer asks for confirmation.
**Migration**: Replaced by "Replace on duplicate name", which keeps unique names and replaces without a dialog.

## ADDED Requirements

### Requirement: Replace on duplicate name
Template names SHALL be unique, ignoring case and surrounding whitespace. Saving with an existing name SHALL replace that template, keeping its name, without asking for confirmation.

#### Scenario: Replace existing name
- **WHEN** a template `Pretty` exists and the user saves the current chain as `pretty`
- **THEN** the `Pretty` template is replaced with the current chain without a confirmation dialog, and only one such template exists

### Requirement: Save to linked template
The Chain tool SHALL provide a Save action. When the chain is linked to a template, Save SHALL replace that template's steps with the current chain, keeping its name, without asking for confirmation. When no template is linked, Save SHALL behave like Save as.

#### Scenario: Save updates linked template
- **WHEN** the user loads `B64 to JSON`, disables a step, and uses Save
- **THEN** `B64 to JSON` keeps its name and now has that step disabled, and no dialog is shown

#### Scenario: Save without linked template
- **WHEN** the chain has steps but no linked template and the user uses Save
- **THEN** the user is asked for a template name, as with Save as

#### Scenario: Storage unavailable on save
- **WHEN** the user uses Save and local storage cannot be written
- **THEN** an error message is shown, and the chain and its link are unchanged

### Requirement: Unsaved marker
The Chain tool SHALL show an unsaved marker while the chain is linked to a template and its steps, their order, options, or enabled states differ from that template. It SHALL NOT show the template's name. A chain with no linked template SHALL show no marker.

#### Scenario: Edit shows marker
- **WHEN** the user loads `B64 to JSON` and changes the JSON indent option
- **THEN** the unsaved marker is shown

#### Scenario: Save clears marker
- **WHEN** the unsaved marker is shown and the user uses Save
- **THEN** the marker disappears

#### Scenario: Reverting clears marker
- **WHEN** the user changes an option of a loaded template and then sets it back to its saved value
- **THEN** the marker is not shown

#### Scenario: Input does not count
- **WHEN** the user loads a template and only edits the input text
- **THEN** the marker is not shown

#### Scenario: No linked template
- **WHEN** the chain has steps but no linked template
- **THEN** the marker is not shown

### Requirement: New chain
The Chain tool SHALL provide a New action that removes every step and the template link, keeps the input text, and asks for no confirmation. After New, the app SHALL show a notice with an Undo action for at least 5 seconds that restores the previous steps and link.

#### Scenario: New clears steps
- **WHEN** the user loads `B64 to JSON`, types input, and uses New
- **THEN** the chain has no steps, the input is unchanged, no unsaved marker is shown, and no dialog was shown

#### Scenario: Undo New
- **WHEN** the user uses New and then clicks Undo
- **THEN** the previous steps are back and Save updates the previously linked template

#### Scenario: Empty chain
- **WHEN** the chain has no steps and no linked template
- **THEN** the New action is unavailable

### Requirement: Linked template persists
The template link SHALL be saved with the browser session and restored on reload. When the linked template is deleted, the chain SHALL be unlinked with no notice. Renaming the linked template SHALL keep the link.

#### Scenario: Link survives reload
- **WHEN** the user loads `B64 to JSON`, edits a step, and reloads the page
- **THEN** the unsaved marker is still shown and Save updates `B64 to JSON`

#### Scenario: Linked template deleted
- **WHEN** the chain is linked to `B64 to JSON` and the user deletes that template from the sidebar
- **THEN** the unsaved marker is not shown and Save asks for a name

#### Scenario: Linked template renamed
- **WHEN** the chain is linked to `B64 to JSON` and the user renames it to `Decode JSON`, then uses Save
- **THEN** `Decode JSON` is updated with the current chain
