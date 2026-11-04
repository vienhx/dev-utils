import { describe, expect, it } from 'vitest';
import { decodeEscapes, resolveOptions, type StepDef } from './step';

const sep: StepDef = {
  type: 'test.sep',
  name: 'Sep',
  keywords: [],
  defaults: { sep: ', ' },
  options: [{ kind: 'text', key: 'sep', label: 'Separator', maxLength: 100 }],
  run: (v) => ({ ok: true, value: v }),
};

describe('text option validation', () => {
  const tests: { name: string; raw: unknown; want: string }[] = [
    { name: 'valid string kept', raw: ' | ', want: ' | ' },
    { name: 'empty string kept', raw: '', want: '' },
    { name: 'string at the cap kept', raw: 'x'.repeat(100), want: 'x'.repeat(100) },
    { name: 'over-length string falls back', raw: 'x'.repeat(101), want: ', ' },
    { name: 'non-string falls back', raw: 5, want: ', ' },
  ];
  for (const tt of tests) {
    it(tt.name, () => {
      expect(resolveOptions(sep, { sep: tt.raw })).toEqual({ sep: tt.want });
    });
  }
});

describe('decodeEscapes', () => {
  const tests: { name: string; input: string; want: string }[] = [
    { name: 'tab', input: '\\t', want: '\t' },
    { name: 'newline', input: '\\n', want: '\n' },
    { name: 'escaped backslash', input: '\\\\', want: '\\' },
    { name: 'escaped backslash before t', input: '\\\\t', want: '\\t' },
    { name: 'other backslash kept', input: '\\x', want: '\\x' },
    { name: 'trailing backslash kept', input: 'a\\', want: 'a\\' },
    { name: 'mixed', input: 'a\\tb\\nc\\\\d', want: 'a\tb\nc\\d' },
    { name: 'plain text unchanged', input: ', ', want: ', ' },
  ];
  for (const tt of tests) {
    it(tt.name, () => {
      expect(decodeEscapes(tt.input)).toBe(tt.want);
    });
  }
});
