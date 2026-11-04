# Chain

**Related:** [pipeline-workspace](../../openspec/specs/pipeline-workspace/spec.md), [text-converters](../../openspec/specs/text-converters/spec.md), [templates](templates.md), [architecture](../tech/architecture.md)

The Chain tool (`#/chain`, the default route) runs input text through an ordered chain of [steps](../overview.md#glossary) and shows the output live.

## Entry points

| Trigger                                                         | Who / gate | Input                              |
| --------------------------------------------------------------- | ---------- | ---------------------------------- |
| Typing in Input                                                 | Anyone     | Text                               |
| _Add step_ button or Ctrl/⌘+K picker                            | Anyone     | Step chosen by name/keyword search |
| Step card: options, Enabled, ✕, arrows, drag handle, eye (peek) | Anyone     | Option value, toggle, new position |
| _Copy_ / _Use as input_ on the output                           | Anyone     | Current output                     |
| Page load                                                       | Anyone     | Saved session                      |

## How it works

### Evaluate

1. `Chain.svelte` holds `input` and `steps` as `$state`. Input edits reach `evalInput` after a 150 ms debounce; step and option edits apply at once.
2. `evaluate(text(evalInput), steps)` walks the chain: a disabled step passes its input through; an enabled step's `run` gets the value and options merged by `resolveOptions`, with text options passed through `decodeEscapes`.
3. A step that fails (or throws, or has an unknown `type`) gets `error`; every later step gets `skipped`.
4. Each `StepCard` shows its result status (`okLabel`, e.g. "valid", or `ok`/`error`/`skipped`/`disabled`); peek shows that step's value.
5. `OutputBox` shows the final value via `display`: text if it is valid UTF-8, else `binary, N bytes` with a hex preview of the first 256 bytes. On error it shows the error.

**Outcome:** the output reflects the input and every enabled step, in order.

### Session save and restore

1. On load, `loadSession` restores input, steps and the template link; unknown or malformed steps are dropped and options re-validated.
2. Every change calls `createSessionSaver().save` (300 ms debounce); `pagehide` and unmount flush it.

**Outcome:** a reload restores the same input and chain. Nothing is sent anywhere.

## State and dependencies

- **Owns:** the session key `devutils:v1:session` ([data model](../tech/architecture.md#data-model)).
- **Uses:** the step registry (`getStep`, `steps`), template storage (see [templates](templates.md)), shell toasts, dialogs and `route`.
- **Emits / consumes:** reads `?template=<id>` from the route (handled in [templates](templates.md)).

## Important constraints

- Step behaviour, options and error messages: [text-converters](../../openspec/specs/text-converters/spec.md).
- Error stops the chain, byte display, copy/swap, responsive layout: [pipeline-workspace](../../openspec/specs/pipeline-workspace/spec.md).
- All processing stays in the browser: [client-privacy](../../openspec/specs/client-privacy/spec.md).

## Failures and limitations

- A failing step shows its error on the card and in the output; later steps show `skipped`.
- Blocked or full localStorage: the chain works but isn't restored after reload.
- Clipboard denied: an error toast "Couldn't copy to the clipboard".
- Drag and drop doesn't work on touch; the arrow buttons do.
- Very large inputs run on the main thread and can lag.

## Before changing

- Step `type` ids are stored in sessions and templates; renaming one orphans saved data.
- Keep `core/` free of Svelte and DOM imports so it stays unit-testable.
- New steps must fit the lazy chunk budget (`pnpm size`).
- Text options are stored and shown as typed (`\t`) and decoded only at run time; don't store decoded values.

## Implementation map

| Responsibility                             | Location                                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Workspace, debounce, session save, toolbar | `src/tools/chain/Chain.svelte`                                                                                           |
| Step card, options, status, peek           | `src/tools/chain/StepCard.svelte`, `ValueView.svelte`                                                                    |
| Picker and search, reorder helper          | `src/tools/chain/Picker.svelte`, `filter.ts` `filterSteps`, `moveItem`                                                   |
| Output, copy, use as input                 | `src/tools/chain/OutputBox.svelte`                                                                                       |
| Evaluation                                 | `src/core/pipeline.ts` `evaluate`                                                                                        |
| Steps                                      | `src/core/registry.ts` `steps`, `src/steps/json/`, `src/steps/base64/`, `src/steps/lines/`                               |
| Session storage                            | `src/storage/session.ts`                                                                                                 |
| Verification                               | `src/core/*.test.ts`, `src/steps/**/*.test.ts`, `src/storage/session.test.ts`, `e2e/chain.spec.ts`, `e2e/layout.spec.ts` |
