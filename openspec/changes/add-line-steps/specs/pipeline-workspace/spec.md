# Spec Delta

## ADDED Requirements

### Requirement: Text options
A step option MAY be free text. A text option SHALL be shown on the step card as a single-line text input that accepts at most 100 characters. Changing it SHALL recompute the output like any other option.

#### Scenario: Edit a text option
- **WHEN** the chain is [Join lines], the input is the lines `a`, `b`, and the user changes the separator to ` | `
- **THEN** the output is `a | b`

#### Scenario: Length capped
- **WHEN** the user types or pastes more than 100 characters into a text option
- **THEN** the option holds only the first 100 characters

### Requirement: Escape sequences in text options
Before a step runs, its text options SHALL be read with `\t` as a tab, `\n` as a newline and `\\` as one backslash, from left to right. A backslash followed by any other character, or at the end, SHALL be kept as typed. The card SHALL show the option as typed.

#### Scenario: Tab separator
- **WHEN** the chain is [Join lines] with separator `\t` and the input is the lines `a`, `b`
- **THEN** the output is `a`, a tab, then `b`, and the card still shows `\t`

#### Scenario: Escaped backslash
- **WHEN** the chain is [Join lines] with separator `\\t` and the input is the lines `a`, `b`
- **THEN** the output is `a\tb` with a literal backslash and `t`

#### Scenario: Other backslash kept
- **WHEN** the chain is [Join lines] with separator `\x` and the input is the lines `a`, `b`
- **THEN** the output is `a\xb`

### Requirement: Saved text options are validated
When a session or template is loaded, a saved text option that is not text or is longer than 100 characters SHALL be replaced by that option's default, without an error.

#### Scenario: Oversized saved option
- **WHEN** a saved session holds a Join lines step whose separator is 150 characters long, and the page loads
- **THEN** the step shows the default separator `, ` and the output uses it
