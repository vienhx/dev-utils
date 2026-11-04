# Design

## Context

Steps are `StepDef`s in `src/steps/<family>/`, listed in `core/registry.ts`. Options are declarative (`select` | `number`), rendered generically by `StepCard.svelte`, and re-validated on every run and load by `resolveOptions` / `fieldAccepts`. Sessions and templates store options raw and always pass through `resolveOptions`. See proposal.md for motivation and specs for exact behaviour.

## Goals / Non-Goals

**Goals:**
- New steps need no step-specific UI.
- The text option kind works for any future step, not only line steps.
- Saved sessions and templates keep loading unchanged.

**Non-Goals:**
- A separate Array tool or page.
- Showing whitespace visibly in text inputs.
- Full JSON string escaping in Quote lines (the JSON escape step covers that).

## Decisions

### 1. List operations are Chain steps, not a new tool
They are text → text transforms, so they get composition with JSON/Base64 steps, templates, session restore and peek for free. A preset (e.g. SQL IN list) is a saved template.
Rejected: a separate Array tool, which would need its own page, session and template wiring and could not mix with other steps.
Doc: `tech/architecture.md` Decisions.

### 2. `text` option kind with a length cap
`TextField { kind: 'text', key, label, maxLength }` joins the `OptionField` union. `fieldAccepts` accepts a string no longer than `maxLength` (100 for every field in this change), so `resolveOptions` already falls back to the default for bad saved values. The card renders `<input type="text" maxlength>` bound to the option, in the mono font.
Rejected: a select with a "Custom…" choice that reveals a text box. That needs two keys per option and conditional fields on the card.
Doc: `tech/architecture.md` Conventions (Add a step) and code map row for `core/step.ts`.

### 3. Escape sequences decoded in the pipeline, stored as typed
`core/step.ts` gains `decodeEscapes(s)`, a single left-to-right scan that handles `\t`, `\n` and `\\` and keeps every other backslash. `runStep` in `core/pipeline.ts` decodes each `text` field after `resolveOptions` and before `run`. Steps therefore always receive real characters. Sessions, templates and the card keep the typed form, so `\t` stays readable and editable.
Rejected: decoding in each step, which is easy to forget for future steps. Also rejected: storing decoded values, which would put an invisible tab or newline inside a one-line input.
Doc: `tech/architecture.md` Decisions.

### 4. Step ids and family
- `src/steps/lines/` holds `lines.dedupe`, `lines.quote`, `lines.join` and `text.wrap`, plus a shared `splitLines(text): string[]`.
- `splitLines` splits on `/\r?\n/` and drops one final empty element.
- Wrap gets `text.wrap` because it acts on the whole text, not per line. Ids are stored in sessions and templates and are never renamed, so the id should describe what the step does.
- Registry order: after the Base64 steps, in the order dedupe, quote, join, wrap, which is the order users usually chain them.
- Each step gets picker keywords: dedupe (`unique`, `distinct`, `duplicate`); quote (`wrap`, `string`, `escape`); join (`compact`, `one line`, `separator`, `csv`, `implode`); wrap (`array`, `brackets`, `list`, `in`).
Rejected: `lines.wrap`.

### 5. Step algorithms
- **Dedupe:** use a `Set` of comparison keys. The key is the trimmed line (when trim is on), lower-cased with `toLowerCase` (when case is ignore). The emitted line is the trimmed line, or the original when trim is off.
- **Quote backslash escape:** replace `\` with `\\` first, then each occurrence of the after text with `\` + after. For double escape, replace each occurrence of the after text with after + after. Use `split`/`join`, not RegExp, so the user's text is never treated as a pattern.
- All four steps read input with `asText`, the same way the JSON steps do.

## Risks / Trade-offs

- [Backslash escape is not full JSON: a line with a raw tab gives an invalid JSON string] → spec and picker keywords point users to JSON escape. Proper escaping stays out of scope.
- [A trailing space in a separator is invisible in the input] → the default is `, ` and the field uses the mono font. A visible-whitespace overlay can come later.
- [`toLowerCase` misses some Unicode case folds (e.g. `ß` vs `SS`)] → acceptable for dev lists. Locale-aware folding would differ by browser.
- [Large lists run on the main thread] → the existing 150 ms input debounce applies. Dedupe is O(n).

## Migration Plan

None. This change only adds things. Existing stored options never contain a `text` field, and new steps are unknown to older builds, which already drop unknown steps on load.
