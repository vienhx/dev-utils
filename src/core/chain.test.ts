import { describe, expect, it } from 'vitest';
import { evaluate } from './pipeline';
import { getStep } from './registry';
import { createStep, type StepInstance } from './step';
import { NOT_UTF8, display, text } from './value';

function chain(...types: (string | [string, Record<string, unknown>])[]): StepInstance[] {
  return types.map((t) => {
    const [type, opts] = typeof t === 'string' ? [t, {}] : t;
    const def = getStep(type);
    if (!def) throw new Error(type);
    return createStep(def, opts);
  });
}

describe('built-in chains', () => {
  const tests: {
    name: string;
    input: string;
    steps: StepInstance[];
    want: ReturnType<typeof display> | { error: RegExp | string; index: number };
  }[] = [
    {
      name: 'text converted to bytes for Base64 encode',
      input: 'héllo',
      steps: chain('base64.encode'),
      want: { kind: 'text', text: 'aMOpbGxv' },
    },
    {
      name: 'decoded bytes shown as text when valid UTF-8',
      input: 'aGVsbG8=',
      steps: chain('base64.decode'),
      want: { kind: 'text', text: 'hello' },
    },
    {
      name: 'decoded binary shown as hex',
      input: '/9j/4A==',
      steps: chain('base64.decode'),
      want: { kind: 'binary', length: 4, hex: 'ff d8 ff e0', truncated: false },
    },
    {
      name: 'Base64 decode then JSON format',
      input: 'eyJhIjoxfQ==',
      steps: chain('base64.decode', 'json.format'),
      want: { kind: 'text', text: '{\n  "a": 1\n}' },
    },
    {
      name: 'binary into JSON format fails',
      input: '/9j/4A==',
      steps: chain('base64.decode', 'json.format'),
      want: { error: NOT_UTF8, index: 1 },
    },
    {
      name: 'invalid Base64 stops the chain',
      input: '!!!',
      steps: chain('base64.decode', 'json.format'),
      want: { error: /^invalid Base64/, index: 0 },
    },
    {
      name: 'format indent option',
      input: '{"a":1}',
      steps: chain(['json.format', { indent: '4' }]),
      want: { kind: 'text', text: '{\n    "a": 1\n}' },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const r = evaluate(text(tt.input), tt.steps);
      if ('error' in tt.want) {
        expect(r.output.ok).toBe(false);
        if (!r.output.ok) {
          expect(r.output.error).toMatch(tt.want.error);
          expect(r.output.index).toBe(tt.want.index);
          expect(r.results.slice(tt.want.index + 1).every((x) => x.status === 'skipped')).toBe(
            true,
          );
        }
      } else {
        expect(r.output.ok && display(r.output.value)).toEqual(tt.want);
      }
    });
  }

  it('disabling Base64 encode passes input through', () => {
    const steps = chain('base64.encode');
    steps[0]!.enabled = false;
    const r = evaluate(text('hi'), steps);
    expect(r.output).toEqual({ ok: true, value: text('hi') });
  });
});
