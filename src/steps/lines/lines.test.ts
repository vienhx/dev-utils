import { describe, expect, it } from 'vitest';
import { evaluate } from '../../core/pipeline';
import { getStep } from '../../core/registry';
import { createStep, type StepInstance } from '../../core/step';
import { NOT_UTF8, text } from '../../core/value';
import { splitLines } from './split';

function chain(...types: (string | [string, Record<string, unknown>])[]): StepInstance[] {
  return types.map((t) => {
    const [type, opts] = typeof t === 'string' ? [t, {}] : t;
    const def = getStep(type);
    if (!def) throw new Error(type);
    return createStep(def, opts);
  });
}

// Runs through evaluate so text options are decoded like in the app.
function run(input: string, steps: StepInstance[]) {
  const r = evaluate(text(input), steps).output;
  return r.ok ? { text: r.value.kind === 'text' ? r.value.text : null } : { error: r.error };
}

describe('splitLines', () => {
  const tests: { name: string; input: string; want: string[] }[] = [
    { name: 'empty input has no lines', input: '', want: [] },
    { name: 'one trailing break ignored', input: 'a\nb\n', want: ['a', 'b'] },
    { name: 'Windows breaks', input: 'a\r\nb\r\n', want: ['a', 'b'] },
    { name: 'empty line kept', input: 'a\n\nb', want: ['a', '', 'b'] },
    { name: 'only one trailing break dropped', input: 'a\n\n', want: ['a', ''] },
  ];
  for (const tt of tests) {
    it(tt.name, () => {
      expect(splitLines(tt.input)).toEqual(tt.want);
    });
  }
});

describe('line steps', () => {
  const tests: { name: string; input: string; steps: StepInstance[]; want: string }[] = [
    // Line splitting
    {
      name: 'join ignores trailing line break',
      input: 'a\nb\n',
      steps: chain(['lines.join', { separator: ',' }]),
      want: 'a,b',
    },
    {
      name: 'join splits Windows line breaks',
      input: 'a\r\nb\r\n',
      steps: chain(['lines.join', { separator: ',' }]),
      want: 'a,b',
    },
    {
      name: 'join keeps empty line',
      input: 'a\n\nb',
      steps: chain(['lines.join', { separator: ',' }]),
      want: 'a,,b',
    },
    { name: 'dedupe empty input', input: '', steps: chain('lines.dedupe'), want: '' },
    { name: 'quote empty input', input: '', steps: chain('lines.quote'), want: '' },
    { name: 'join empty input', input: '', steps: chain('lines.join'), want: '' },
    // Remove duplicate lines
    {
      name: 'dedupe keeps first occurrences in order',
      input: 'b\na\nb\nc\na',
      steps: chain('lines.dedupe'),
      want: 'b\na\nc',
    },
    {
      name: 'dedupe without trim keeps whitespace variants',
      input: 'a\n a',
      steps: chain(['lines.dedupe', { trim: 'keep' }]),
      want: 'a\n a',
    },
    {
      name: 'dedupe trims before comparing',
      input: ' a\na \nb',
      steps: chain(['lines.dedupe', { trim: 'trim' }]),
      want: 'a\nb',
    },
    {
      name: 'dedupe ignores case',
      input: 'Apple\napple\nAPPLE',
      steps: chain(['lines.dedupe', { case: 'ignore' }]),
      want: 'Apple',
    },
    // Quote lines
    {
      name: 'quote with default quotes and escaping',
      input: 'a\nsay "hi"\nC:\\x',
      steps: chain('lines.quote'),
      want: '"a"\n"say \\"hi\\""\n"C:\\\\x"',
    },
    {
      name: 'quote with double escape for SQL',
      input: "it's",
      steps: chain(['lines.quote', { before: "'", after: "'", escape: 'double' }]),
      want: "'it''s'",
    },
    {
      name: 'quote with no escape',
      input: "it's",
      steps: chain(['lines.quote', { before: "'", after: "'", escape: 'none' }]),
      want: "'it's'",
    },
    {
      name: 'quote with different before and after',
      input: 'a\nb',
      steps: chain(['lines.quote', { before: '<li>', after: '</li>', escape: 'none' }]),
      want: '<li>a</li>\n<li>b</li>',
    },
    {
      name: 'quote empty line',
      input: 'a\n\nb',
      steps: chain('lines.quote'),
      want: '"a"\n""\n"b"',
    },
    {
      name: 'quote with empty after leaves line unchanged',
      input: 'a"\\b',
      steps: chain(['lines.quote', { before: '-', after: '' }]),
      want: '-a"\\b',
    },
    // Join lines
    {
      name: 'join with default separator',
      input: '"a"\n"b"\n"c"',
      steps: chain('lines.join'),
      want: '"a", "b", "c"',
    },
    {
      name: 'join with tab',
      input: 'a\nb',
      steps: chain(['lines.join', { separator: '\\t' }]),
      want: 'a\tb',
    },
    {
      name: 'join with empty separator',
      input: 'a\nb',
      steps: chain(['lines.join', { separator: '' }]),
      want: 'ab',
    },
    {
      name: 'join with custom separator',
      input: 'a\nb',
      steps: chain(['lines.join', { separator: ' | ' }]),
      want: 'a | b',
    },
    {
      name: 'join with escaped backslash',
      input: 'a\nb',
      steps: chain(['lines.join', { separator: '\\\\t' }]),
      want: 'a\\tb',
    },
    {
      name: 'join keeps other backslash',
      input: 'a\nb',
      steps: chain(['lines.join', { separator: '\\x' }]),
      want: 'a\\xb',
    },
    // Wrap
    { name: 'wrap as array', input: '"a", "b"', steps: chain('text.wrap'), want: '["a", "b"]' },
    {
      name: 'wrap for SQL IN list',
      input: '1\n2',
      steps: chain(['lines.quote', { before: "'", after: "'" }], 'lines.join', [
        'text.wrap',
        { open: '(', close: ')' },
      ]),
      want: "('1', '2')",
    },
    { name: 'wrap empty input', input: '', steps: chain('text.wrap'), want: '[]' },
    // Byte input
    {
      name: 'decoded bytes are joined',
      input: 'YQpi',
      steps: chain('base64.decode', 'lines.join'),
      want: 'a, b',
    },
  ];
  for (const tt of tests) {
    it(tt.name, () => {
      expect(run(tt.input, tt.steps)).toEqual({ text: tt.want });
    });
  }

  it('fails Wrap on binary bytes', () => {
    const r = evaluate(text('/9j/4A=='), chain('base64.decode', 'text.wrap')).output;
    expect(r).toEqual({ ok: false, error: NOT_UTF8, index: 1 });
  });

  it('keeps the typed separator on the step', () => {
    const steps = chain(['lines.join', { separator: '\\t' }]);
    run('a\nb', steps);
    expect(steps[0]?.options).toEqual({ separator: '\\t' });
  });
});
