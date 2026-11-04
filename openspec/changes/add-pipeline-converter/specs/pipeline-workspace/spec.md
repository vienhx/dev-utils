# Spec Delta

## Purpose

Provides the Chain tool's workspace, where a user enters input text, builds an ordered chain of transform steps, and sees the transformed output live.

## ADDED Requirements

### Requirement: Input and output boxes
The workspace SHALL show an editable input box and a read-only output box. The output box SHALL show the result of running the input through every enabled step in order.

#### Scenario: Empty chain passes input through
- **WHEN** the chain has no steps and the user types `{"a":1}` in the input box
- **THEN** the output box shows `{"a":1}`

#### Scenario: Output is read-only
- **WHEN** the user tries to type into the output box
- **THEN** the output content does not change

### Requirement: Add steps to the chain
The user SHALL be able to append any step from the catalog to the end of the chain, using either a visible add control or a keyboard-driven picker that filters steps by name.

#### Scenario: Add step via picker
- **WHEN** the user opens the step picker with Ctrl+K (Cmd+K on macOS), types `b64 dec`, and presses Enter
- **THEN** a "Base64 decode" step is appended to the end of the chain

#### Scenario: Same step added twice
- **WHEN** the user adds "JSON format" while the chain already contains "JSON format"
- **THEN** the chain contains two independent "JSON format" steps

### Requirement: Edit the chain
The user SHALL be able to remove a step, move a step up or down (including by drag and drop), and enable or disable a step. A disabled step SHALL pass its input through unchanged.

#### Scenario: Reorder steps
- **WHEN** the chain is [Base64 decode, JSON format] and the user moves JSON format above Base64 decode
- **THEN** the chain becomes [JSON format, Base64 decode] and the output recomputes in the new order

#### Scenario: Disable a step
- **WHEN** the chain is [Base64 encode] with input `hi` and the user disables Base64 encode
- **THEN** the output is `hi`

#### Scenario: Remove a step
- **WHEN** the user removes the only step in the chain
- **THEN** the chain is empty and the output equals the input

### Requirement: Step options
A step that has options SHALL show them on its card. Changing an option SHALL recompute the output.

#### Scenario: Change indent option
- **WHEN** the chain is [JSON format] with indent 2 and the user changes indent to 4
- **THEN** the output is re-rendered with 4-space indentation

### Requirement: Live evaluation
The output SHALL recompute automatically after the input, the chain, or any step option changes, without the user pressing a run button. Recompute MAY be debounced, by no more than 300 ms after the last change.

#### Scenario: Typing updates output
- **WHEN** the chain is [Base64 encode] and the user types `abc` in the input
- **THEN** the output shows `YWJj` within 300 ms of the last keystroke

### Requirement: Typed values between steps
Values passed between steps SHALL be either text or bytes. Each step SHALL accept and produce a defined value type, and text SHALL be converted to bytes as UTF-8 when a step needs bytes.

#### Scenario: Text converted to bytes
- **WHEN** the chain is [Base64 encode] and the input is `héllo`
- **THEN** the output is `aMOpbGxv` (the Base64 of the UTF-8 bytes)

### Requirement: Display of byte output
When the final value is bytes, the output box SHALL show them as text if they are valid UTF-8. Otherwise it SHALL show a "binary, N bytes" label with a hexadecimal preview.

#### Scenario: Bytes that are valid UTF-8
- **WHEN** the chain is [Base64 decode] and the input is `aGVsbG8=`
- **THEN** the output shows `hello`

#### Scenario: Bytes that are not valid UTF-8
- **WHEN** the chain is [Base64 decode] and the input is `/9j/4A==`
- **THEN** the output shows a binary label stating 4 bytes and the hex preview `ff d8 ff e0`

### Requirement: Error stops the chain
When a step fails, evaluation SHALL stop at that step. The failing step SHALL show the error message, later steps SHALL be marked as skipped, and the output box SHALL show the error instead of a stale result.

#### Scenario: Middle step fails
- **WHEN** the chain is [Base64 decode, JSON format] and the input is `!!!`
- **THEN** Base64 decode shows an invalid-Base64 error, JSON format is marked skipped, and the output box shows the error

#### Scenario: Recovery after fixing input
- **WHEN** the input is changed from invalid to valid input
- **THEN** all step errors clear and the output shows the new result

### Requirement: Per-step status and peek
Each step SHALL show its status (ok, error, skipped, or disabled). The user SHALL be able to expand a step to see its intermediate output.

#### Scenario: Peek intermediate value
- **WHEN** the chain is [Base64 decode, JSON format] with valid input and the user expands Base64 decode
- **THEN** the decoded value before formatting is shown on that step

### Requirement: Copy and swap
The workspace SHALL provide a one-click copy of the output to the clipboard, and a swap action that moves the current output text into the input box.

#### Scenario: Copy output
- **WHEN** the user clicks copy on the output
- **THEN** the output text is placed on the clipboard and a brief confirmation appears

#### Scenario: Swap output into input
- **WHEN** the output is `YWJj` and the user clicks swap
- **THEN** the input box contains `YWJj`

### Requirement: Session restore
The current input, chain, step options, and enabled states SHALL be saved in the browser and restored when the page is reloaded.

#### Scenario: Reload restores state
- **WHEN** the user builds the chain [JSON compact], enters input, and reloads the page
- **THEN** the same chain and input are shown and the output is recomputed

#### Scenario: Corrupt saved state
- **WHEN** the saved state cannot be read or parsed
- **THEN** the workspace starts with an empty input and an empty chain, without an error dialog

### Requirement: Responsive layout
The workspace SHALL fill the content area beside the sidebar. When that area is at least 1024 px wide, the input, chain, and output SHALL appear side by side. When it is narrower, they SHALL stack vertically as input, chain, output, with no horizontal page scrolling.

#### Scenario: Mobile width
- **WHEN** the page is viewed at 375 px wide
- **THEN** input, chain, and output are stacked vertically and the page does not scroll horizontally

#### Scenario: Desktop width
- **WHEN** the page is viewed at 1440 px wide with the sidebar expanded
- **THEN** input, chain, and output are shown in three side-by-side columns

#### Scenario: Narrow content area
- **WHEN** the page is 1100 px wide with the sidebar expanded, leaving the content area under 1024 px
- **THEN** input, chain, and output are stacked vertically

