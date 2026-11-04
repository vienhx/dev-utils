# Spec Delta

## ADDED Requirements

### Requirement: Line splitting
The Remove duplicate lines, Quote lines and Join lines steps SHALL split their input into lines at each `\n` or `\r\n`. A single line break at the end of the input SHALL NOT create an empty last line. Empty input SHALL have no lines. Empty lines elsewhere SHALL be kept as lines. Steps that output lines SHALL join them with `\n` and no trailing line break.

#### Scenario: Trailing line break ignored
- **WHEN** Join lines with separator `,` receives `a`, a newline, `b`, a newline
- **THEN** the output is `a,b`

#### Scenario: Windows line breaks
- **WHEN** Join lines with separator `,` receives `a\r\nb\r\n`
- **THEN** the output is `a,b`

#### Scenario: Empty line kept
- **WHEN** Join lines with separator `,` receives `a`, a newline, a newline, `b`
- **THEN** the output is `a,,b`

#### Scenario: Empty input
- **WHEN** Remove duplicate lines, Quote lines or Join lines receives empty input
- **THEN** the output is empty

### Requirement: Remove duplicate lines
The Remove duplicate lines step SHALL output each distinct line once, at the position of its first occurrence. It SHALL have a trim option, keep (default) or trim, where trim removes leading and trailing whitespace from each line before comparing and in the output. It SHALL have a case option, sensitive (default) or ignore, where ignore compares lines case-insensitively and keeps the first occurrence as written.

#### Scenario: Duplicates removed in order
- **WHEN** the input is the lines `b`, `a`, `b`, `c`, `a` with default options
- **THEN** the output is the lines `b`, `a`, `c`

#### Scenario: Whitespace differs without trim
- **WHEN** the input is the lines `a` and ` a` with the trim option keep
- **THEN** the output is the lines `a` and ` a`

#### Scenario: Trim before comparing
- **WHEN** the input is the lines ` a`, `a `, `b` with the trim option trim
- **THEN** the output is the lines `a`, `b`

#### Scenario: Ignore case
- **WHEN** the input is the lines `Apple`, `apple`, `APPLE` with the case option ignore
- **THEN** the output is the single line `Apple`

### Requirement: Quote lines
The Quote lines step SHALL add a before text and an after text around each line, defaulting to `"` and `"`. It SHALL have an escape option applied to the line content before quoting: backslash (default) prefixes each `\` and each occurrence of the after text with `\`; double repeats each occurrence of the after text; none changes nothing. When the after text is empty, escaping SHALL NOT change the line.

#### Scenario: Default quotes and escaping
- **WHEN** the input is the lines `a`, `say "hi"`, `C:\x` with default options
- **THEN** the output is the lines `"a"`, `"say \"hi\""`, `"C:\\x"`

#### Scenario: Double escape for SQL
- **WHEN** the input is the line `it's` with before `'`, after `'` and escape double
- **THEN** the output is `'it''s'`

#### Scenario: No escape
- **WHEN** the input is the line `it's` with before `'`, after `'` and escape none
- **THEN** the output is `'it's'`

#### Scenario: Different before and after text
- **WHEN** the input is the lines `a`, `b` with before `<li>`, after `</li>` and escape none
- **THEN** the output is the lines `<li>a</li>`, `<li>b</li>`

#### Scenario: Empty line quoted
- **WHEN** the input is the lines `a`, an empty line, `b` with default options
- **THEN** the output is the lines `"a"`, `""`, `"b"`

### Requirement: Join lines
The Join lines step SHALL output all lines joined into one text with a separator between each pair of lines. The separator SHALL default to `, `.

#### Scenario: Join with default separator
- **WHEN** the input is the lines `"a"`, `"b"`, `"c"` with default options
- **THEN** the output is `"a", "b", "c"`

#### Scenario: Join with tab
- **WHEN** the input is the lines `a`, `b` and the separator option is `\t`
- **THEN** the output is `a`, a tab, then `b`

#### Scenario: Join with empty separator
- **WHEN** the input is the lines `a`, `b` and the separator option is empty
- **THEN** the output is `ab`

### Requirement: Wrap
The Wrap step SHALL output an open text, then its whole input unchanged, then a close text. Open and close SHALL default to `[` and `]`.

#### Scenario: Wrap as array
- **WHEN** the input is `"a", "b"` with default options
- **THEN** the output is `["a", "b"]`

#### Scenario: Wrap for SQL IN list
- **WHEN** the chain is [Quote lines with `'`/`'`, Join lines, Wrap with `(`/`)`] and the input is the lines `1`, `2`
- **THEN** the output is `('1', '2')`

#### Scenario: Wrap empty input
- **WHEN** the input is empty with default options
- **THEN** the output is `[]`

### Requirement: Line steps and Wrap accept byte input
When Remove duplicate lines, Quote lines, Join lines or Wrap receives bytes, it SHALL decode them as UTF-8 text first. Bytes that are not valid UTF-8 SHALL cause the step to fail with an "input is not valid UTF-8 text" error.

#### Scenario: Decoded bytes are joined
- **WHEN** the chain is [Base64 decode, Join lines] and the input is `YQpi` (the bytes of `a`, a newline, `b`)
- **THEN** the output is `a, b`

#### Scenario: Binary bytes into Wrap
- **WHEN** the chain is [Base64 decode, Wrap] and the input is `/9j/4A==`
- **THEN** Wrap fails with an "input is not valid UTF-8 text" error
