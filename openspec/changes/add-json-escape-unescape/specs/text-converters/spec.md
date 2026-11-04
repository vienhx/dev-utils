# Spec Delta

## ADDED Requirements

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
