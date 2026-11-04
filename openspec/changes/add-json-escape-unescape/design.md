# Design

## Context

JSON steps live in `src/steps/json/`. Each is one `StepDef` registered in `src/core/registry.ts`. They read input through `jsonTokens`/`asText`, which decodes bytes as strict UTF-8. The tokenizer (`tokenizer.ts`) already validates string literals: escapes, `\u` hex, raw control characters, unterminated strings. It reports errors as `<message> at line L, column C` through `position()`, but only `tokenize()` is exported, and that function formats against its own source string. Step options support only `select` and `number` fields.

## Goals / Non-Goals

**Goals:**
- Unescape errors use the same messages and position format as the other JSON steps, with positions in the user's original input.
- Escape and unescape are exact inverses under either quotes option.

**Non-Goals:**
- Lenient repair of malformed escapes such as `\x` or single quotes.
- `\uXXXX` output for non-ASCII, or any ASCII-only mode.

## Decisions

### Escape uses `JSON.stringify`
`JSON.stringify(text)` produces the literal. Omitting the quotes slices off the first and last character. It escapes exactly `"`, `\` and control characters, keeps non-ASCII raw, and writes lone surrogates as `\uXXXX`, so the output is always valid JSON. A hand-written escaper would duplicate this for no gain.

### Quotes option is a `select`
`quotes: 'include' | 'omit'`, default `include`. The step model has no boolean field, and adding a field kind for one option is not worth it. Base64's `variant` select follows the same pattern.

### Unescape validates with the tokenizer, then decodes with `JSON.parse`
1. Get the text with `asText`, then trim it, remembering where the trim started.
2. If the trimmed text is empty, return empty output.
3. If it starts with `"`, run `tokenize` on the trimmed text. Any error, including trailing content ("Unexpected ..."), is returned. Otherwise the single token is a string.
4. If not, scan it as string content. A raw `"` fails with `Unescaped quote in string`.
5. Decode the validated literal with `JSON.parse`. It cannot throw at this point.

To report positions against the original input instead of a trimmed or quote-wrapped copy, the tokenizer exports one small addition: a string-content scanner that reuses `readString`'s escape rules and returns `{ ok, error }`, with the offset turned into line and column against a source and base offset passed in by the caller. Its internals (`JsonError`, `readString`, `position`) stay private to the module.

Alternatives considered:
- *Wrap the content in quotes and run `tokenize`*: a raw `"` then surfaces as a confusing "Unexpected 'a'", and line-1 columns are off by one, which would need fixing up inside the formatted message.
- *`JSON.parse` alone*: error text and positions vary by browser and don't match the other JSON steps.

### Picker placement and ids
Types are `json.escape` and `json.unescape`, and they are permanent once released. Registry order: format, compact, validate, escape, unescape, then the Base64 steps. Keywords: escape gets `stringify`, `quote`, `string`. Unescape gets `unquote`, `unstringify`, `string`.

## Risks / Trade-offs

- [Content without quotes is ambiguous for input such as `123` or `true`] → It is treated as content and returned unchanged. This follows the rule and needs no special case. The spec states the rule.
- [Trimming drops intended leading or trailing spaces in content without quotes] → Rare. Users can quote the literal to keep them, and escape-then-unescape still round-trips because quoted mode only trims outside the quotes.
- [Large inputs: validate + parse makes two passes] → Both are linear, and the existing JSON steps make the same trade.
