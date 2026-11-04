# pipeline-templates Specification

## Purpose

Lets users save step chains as named templates in their browser and reuse them later, without re-adding and reconfiguring each step.

## Requirements

### Requirement: Save chain as template
From the Chain tool, the user SHALL be able to save the current chain as a named template belonging to Chain. A template SHALL store the ordered steps with their options and enabled states. It SHALL NOT store the input text.

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
- **THEN** the save-as-template action is unavailable

### Requirement: Overwrite on duplicate name
Template names SHALL be unique, ignoring case and surrounding whitespace. Saving with an existing name SHALL ask the user to confirm before replacing that template.

#### Scenario: Confirm overwrite
- **WHEN** a template `Pretty` exists and the user saves the current chain as `pretty` and confirms
- **THEN** the `Pretty` template is replaced with the current chain and only one such template exists

#### Scenario: Cancel overwrite
- **WHEN** the user saves with an existing name and cancels the confirmation
- **THEN** the existing template is unchanged

### Requirement: Load template
Loading a template SHALL replace the current chain with a copy of the template's steps and SHALL keep the current input text. Later edits to the chain SHALL NOT change the saved template.

#### Scenario: Load replaces chain
- **WHEN** the chain is [Base64 encode], the input is `{"a":1}`, and the user loads `B64 to JSON`
- **THEN** the chain becomes [Base64 decode, JSON format (indent 4)], the input is still `{"a":1}`, and the output recomputes

#### Scenario: Editing after load
- **WHEN** the user loads a template and then removes a step from the chain
- **THEN** the saved template still contains all of its steps

### Requirement: Undo template load
After a template is loaded, the app SHALL show a notice with an Undo action for at least 5 seconds. Undo SHALL restore the chain that was there before the load.

#### Scenario: Undo restores previous chain
- **WHEN** the chain is [Base64 encode], the user loads `B64 to JSON`, and then clicks Undo
- **THEN** the chain is [Base64 encode] again and the output recomputes

#### Scenario: Notice expires
- **WHEN** the user loads a template and does not click Undo
- **THEN** the notice disappears and the loaded chain stays

### Requirement: Rename and delete templates
From the template's menu in the sidebar, the user SHALL be able to rename a template, subject to the same name rules as saving, and to delete a template after confirming.

#### Scenario: Rename template
- **WHEN** the user renames `B64 to JSON` to `Decode JSON`
- **THEN** the sidebar shows `Decode JSON` under Chain and no longer shows `B64 to JSON`

#### Scenario: Rename to existing name
- **WHEN** the user renames a template to the name of another existing template
- **THEN** the rename is rejected with a message that the name is in use

#### Scenario: Delete template
- **WHEN** the user deletes `Decode JSON` and confirms
- **THEN** the template is removed from the sidebar and is still gone after reload

### Requirement: Templates persist locally
Templates SHALL be stored only in the browser's local storage and SHALL survive page reloads. Unreadable stored templates, or templates that reference unknown steps, SHALL be ignored without breaking the rest of the list.

#### Scenario: Persist across reload
- **WHEN** the user saves a template and reloads the page
- **THEN** the template is still listed

#### Scenario: Unknown step in stored template
- **WHEN** a stored template references a step type the app does not know
- **THEN** that template is shown as unavailable and cannot be loaded, and other templates still work

#### Scenario: Storage unavailable
- **WHEN** local storage cannot be written (for example, quota exceeded or blocked)
- **THEN** saving shows an error message and the current chain is unchanged
