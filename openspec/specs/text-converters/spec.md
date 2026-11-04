# text-converters Specification

## Purpose

Defines the built-in transform steps that can be placed in a pipeline, including their inputs, outputs, options, and error conditions.

## Requirements

### Requirement: JSON validate
The JSON validate step SHALL pass its input through unchanged when the input is valid JSON. When the input is invalid, it SHALL fail with a message that includes the line and column of the error.

#### Scenario: Valid JSON passes through
- **WHEN** the input is `{ "a": 1 }`
- **THEN** the step succeeds, shows a "valid" status, and outputs `{ "a": 1 }` unchanged

#### Scenario: Invalid JSON reports position
- **WHEN** the input is two lines, `{` followed by `"a": }`
- **THEN** the step fails with an error that names line 2 and the column of the unexpected `}`

### Requirement: JSON compact
The JSON compact step SHALL parse its input as JSON and output it with all insignificant whitespace removed. Invalid JSON SHALL fail with the same line and column error as JSON validate.

#### Scenario: Compact formatted JSON
- **WHEN** the input is `{\n  "a": [1, 2]\n}`
- **THEN** the output is `{"a":[1,2]}`

#### Scenario: Compact invalid JSON
- **WHEN** the input is `{"a":}`
- **THEN** the step fails with an error that includes a line and column

### Requirement: JSON format
The JSON format step SHALL parse its input as JSON and output it pretty-printed. It SHALL have an indent option with the values 2 spaces (default), 4 spaces, and tab. Invalid JSON SHALL fail with a line and column error.

#### Scenario: Format with default indent
- **WHEN** the input is `{"a":1}` and the indent option is left at its default
- **THEN** the output is `{\n  "a": 1\n}`

#### Scenario: Format with tab indent
- **WHEN** the input is `{"a":1}` and the indent option is tab
- **THEN** the output is `{\n\t"a": 1\n}`

### Requirement: JSON steps preserve key order and numbers
The JSON steps SHALL keep object keys in their input order. They SHALL keep the original digits of numbers that cannot be represented exactly as double-precision values.

#### Scenario: Key order preserved
- **WHEN** JSON compact receives `{"b":1,"a":2}`
- **THEN** the output is `{"b":1,"a":2}`

#### Scenario: Large integer preserved
- **WHEN** JSON compact receives `{"id":12345678901234567890}`
- **THEN** the output is `{"id":12345678901234567890}`

### Requirement: JSON steps accept byte input
When a JSON step receives bytes, it SHALL decode them as UTF-8 text first. Bytes that are not valid UTF-8 SHALL cause the step to fail with an "input is not valid UTF-8 text" error.

#### Scenario: Decoded bytes are JSON
- **WHEN** the chain is [Base64 decode, JSON format] and the input is `eyJhIjoxfQ==`
- **THEN** the output is `{\n  "a": 1\n}`

#### Scenario: Binary bytes into JSON step
- **WHEN** the chain is [Base64 decode, JSON format] and the input is `/9j/4A==`
- **THEN** JSON format fails with an "input is not valid UTF-8 text" error

### Requirement: Base64 encode
The Base64 encode step SHALL encode its input to Base64 text, converting text input to UTF-8 bytes first. It SHALL have a variant option, standard (default) or URL-safe. The URL-safe variant SHALL use `-` and `_` and omit padding.

#### Scenario: Encode Unicode text
- **WHEN** the input is `héllo` with the standard variant
- **THEN** the output is `aMOpbGxv`

#### Scenario: Encode URL-safe
- **WHEN** the input bytes are `fb ff` (from a previous step) with the URL-safe variant
- **THEN** the output is `-_8`

#### Scenario: Encode empty input
- **WHEN** the input is empty
- **THEN** the output is empty

### Requirement: Base64 decode
The Base64 decode step SHALL decode Base64 text to bytes. It SHALL accept both the standard and URL-safe alphabets, missing padding, and surrounding or embedded whitespace (including line breaks). Any other character, or an impossible length, SHALL fail with an "invalid Base64" error.

#### Scenario: Decode with line breaks
- **WHEN** the input is `aGVs\nbG8=`
- **THEN** the output bytes decode to the text `hello`

#### Scenario: Decode URL-safe without padding
- **WHEN** the input is `-_8`
- **THEN** the output is the bytes `fb ff`

#### Scenario: Invalid character
- **WHEN** the input is `aGVs*bG8=`
- **THEN** the step fails with an "invalid Base64" error

#### Scenario: Impossible length
- **WHEN** the input is `a`
- **THEN** the step fails with an "invalid Base64" error

### Requirement: JSON escape
The JSON escape step SHALL output its input as a JSON string literal, escaping quotes, backslashes and control characters. Non-ASCII characters SHALL be kept as-is. It SHALL have a quotes option: include (default) wraps the output in `"`, omit outputs only the escaped content. The input SHALL NOT be trimmed.

#### Scenario: Escape with quotes
- **WHEN** the input is `say "hi"` followed by a newline and the quotes option is left at its default
- **THEN** the output is `"say \"hi\"\n"`

#### Scenario: Escape without quotes
- **WHEN** the input is `a\b` followed by a tab and the quotes option is omit
- **THEN** the output is `a\\b\t`

#### Scenario: Non-ASCII kept
- **WHEN** the input is `héllo 👋`
- **THEN** the output is `"héllo 👋"`

#### Scenario: Escape empty input
- **WHEN** the input is empty
- **THEN** the output is `""` with quotes included, and empty with quotes omitted

### Requirement: JSON unescape
The JSON unescape step SHALL output the text represented by a JSON string literal. Outer whitespace SHALL be ignored. If the input starts with `"`, it SHALL be read as a complete literal and nothing may follow the closing quote. Otherwise it SHALL be read as the content of a string without its surrounding quotes. Empty input SHALL produce empty output.

#### Scenario: Unescape quoted literal
- **WHEN** the input is `"{\"a\":1}"`
- **THEN** the output is `{"a":1}`

#### Scenario: Unescape without quotes
- **WHEN** the input is `line1\nline2 é`
- **THEN** the output is `line1`, a newline, then `line2 é`

#### Scenario: Surrounding whitespace ignored
- **WHEN** the input is `"a\tb"` followed by a newline
- **THEN** the output is `a`, a tab, then `b`

#### Scenario: Double-escaped JSON
- **WHEN** the chain is [JSON unescape, JSON unescape, JSON format] and the input is `"\"{\\\"a\\\":1}\""`
- **THEN** the output is `{\n  "a": 1\n}`

#### Scenario: Escape then unescape round-trips
- **WHEN** the chain is [JSON escape, JSON unescape] with either quotes option and the input is `say "hi"`, a newline, then `é`
- **THEN** the output equals the input

#### Scenario: Unescape empty input
- **WHEN** the input is empty or only whitespace
- **THEN** the output is empty

### Requirement: JSON unescape reports errors with position
The JSON unescape step SHALL fail with an error that names a line and column in the original input when the literal is invalid: an invalid escape, a raw control character, an unescaped `"` inside content without quotes, a missing closing quote, or content after the closing quote.

#### Scenario: Invalid escape
- **WHEN** the input is `"a\x"`
- **THEN** the step fails with an "Invalid escape in string" error at line 1, column 3

#### Scenario: Unescaped quote in content without quotes
- **WHEN** the input is `{"a":1}`
- **THEN** the step fails with an "Unescaped quote in string" error at line 1, column 2

#### Scenario: Content after closing quote
- **WHEN** the input is `"a" b`
- **THEN** the step fails with an error that includes line 1 and column 5

#### Scenario: Missing closing quote
- **WHEN** the input is `"abc`
- **THEN** the step fails with an "Unterminated string" error

### Requirement: JSON escape and unescape accept byte input
When JSON escape or JSON unescape receives bytes, it SHALL decode them as UTF-8 text first. Bytes that are not valid UTF-8 SHALL cause the step to fail with an "input is not valid UTF-8 text" error.

#### Scenario: Decoded bytes are unescaped
- **WHEN** the chain is [Base64 decode, JSON unescape] and the input is `ImFcbmIi` (the bytes of `"a\nb"`)
- **THEN** the output is `a`, a newline, then `b`

#### Scenario: Binary bytes into JSON escape
- **WHEN** the chain is [Base64 decode, JSON escape] and the input is `/9j/4A==`
- **THEN** JSON escape fails with an "input is not valid UTF-8 text" error

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
