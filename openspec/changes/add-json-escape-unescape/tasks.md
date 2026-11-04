# Tasks

## 1. Tokenizer support

- [x] 1.1 Export a string-content scanner from `src/steps/json/tokenizer.ts` that reuses the existing escape rules, reports an unescaped `"` as `Unescaped quote in string`, and formats `at line L, column C` against a caller-given source and base offset, and verify table-driven tests in `tokenizer.test.ts` cover a valid body, invalid escape, bad `\u`, raw control character, raw quote, and a position on line 2 and after a leading-whitespace offset

## 2. Steps

- [x] 2.1 Add `src/steps/json/escape.ts` (`json.escape`, quotes select include/omit, default include) using `JSON.stringify`, and verify table-driven tests in `json.test.ts` cover every JSON escape scenario in the change's `specs/text-converters` (with and without quotes, non-ASCII, empty input, no trimming, non-UTF-8 bytes)
- [x] 2.2 Add `src/steps/json/unescape.ts` (`json.unescape`): trim, empty to empty, quoted literal through `tokenize`, unquoted content through the new scanner, decode with `JSON.parse`, and verify table-driven tests cover every JSON unescape scenario and error scenario in the spec (quoted, unquoted, whitespace, invalid escape at column 3, raw quote at column 2, trailing content at column 5, unterminated, UTF-8 bytes) plus an escape-then-unescape round-trip for both quotes options
- [x] 2.3 Register both steps after JSON validate in `src/core/registry.ts` with keywords (`stringify`, `quote`, `string` / `unquote`, `unstringify`, `string`), and verify `registry.test.ts` (type list, keywords) and `src/tools/chain/filter.test.ts` (the `json` query now lists five steps; `unquote` finds JSON unescape) are updated and pass
- [x] 2.4 Add a chain test in `src/core/chain.test.ts` for [JSON unescape, JSON unescape, JSON format] on the double-escaped input and [Base64 decode, JSON unescape] on `ImFcbmIi`, and verify both match the spec outputs

## 3. Docs and integration

- [x] 3.1 Add JSON escape (quotes included or omitted) and JSON unescape to the built-in steps list in `README.md`, and verify the list matches the registry
- [x] 3.2 Run `pnpm verify` and confirm typecheck, lint, tests, build, bundle budget and dist scan all pass, and `openspec validate add-json-escape-unescape --strict` passes

## Workflow follow-up

- Archive the change after review, then confirm `openspec/specs/text-converters/spec.md` contains the new requirements.
