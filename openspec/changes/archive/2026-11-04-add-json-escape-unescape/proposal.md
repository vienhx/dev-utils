# Proposal

## Why

Logs, API payloads and config often carry JSON stringified inside a JSON string (`"{\"a\":1}"`), which is unreadable until unescaped. Going the other way, embedding text inside a JSON or code string means escaping quotes, backslashes and newlines by hand. The pipeline has JSON format, compact and validate, but no step for either direction.

## What Changes

- Add a **JSON escape** step: turns any text into a JSON string literal. A `Quotes` option sets whether the surrounding quotes are included (default) or omitted. Non-ASCII characters are kept as-is.
- Add a **JSON unescape** step: turns a JSON string literal back into the raw text. It accepts the literal with or without the surrounding quotes, trims outer whitespace, and reports errors with line and column.
- Both steps decode byte input as UTF-8 first, like the other JSON steps, and both are available in the step picker.
- Out of scope: `\uXXXX` escaping of non-ASCII and URL-friendly encoding. These belong in a separate step.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `text-converters`: adds the JSON escape and JSON unescape requirements.

## Impact

- New step files under `src/steps/json/`, plus two entries in `src/core/registry.ts`.
- The JSON tokenizer may expose its string scanning so unescape errors share its messages and positions.
- No new dependencies. The bundle grows by well under 1 KB gzip.
- Stored sessions and templates are unaffected. The new step types are additive.
