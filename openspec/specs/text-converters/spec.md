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
