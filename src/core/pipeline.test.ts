import { describe, expect, it } from 'vitest';
import { evaluate, type Evaluation } from './pipeline';
import type { StepDef, StepInstance } from './step';
import { text, type Value } from './value';

const upper: StepDef = {
  type: 'test.upper',
  name: 'Upper',
  keywords: [],
  defaults: {},
  options: [],
  run: (v) =>
    v.kind === 'text'
      ? { ok: true, value: text(v.text.toUpperCase()) }
      : { ok: false, error: 'text only' },
};

const failIfX: StepDef = {
  type: 'test.failx',
  name: 'Fail on x',
  keywords: [],
  defaults: {},
  options: [],
  run: (v) =>
    v.kind === 'text' && v.text.includes('x')
      ? { ok: false, error: 'has x' }
      : { ok: true, value: v },
};

const suffix: StepDef<{ s: string }> = {
  type: 'test.suffix',
  name: 'Suffix',
  keywords: [],
  defaults: { s: '!' },
  options: [
    {
      kind: 'select',
      key: 's',
      label: 'S',
      choices: [
        { value: '!', label: '!' },
        { value: '?', label: '?' },
      ],
    },
  ],
  run: (v, o) => ({ ok: true, value: text((v.kind === 'text' ? v.text : '') + o.s) }),
};

const throws: StepDef = {
  type: 'test.throws',
  name: 'Throws',
  keywords: [],
  defaults: {},
  options: [],
  run: () => {
    throw new Error('boom');
  },
};

const defs = new Map<string, StepDef>(
  [upper, failIfX, suffix as unknown as StepDef, throws].map((d) => [d.type, d]),
);
const lookup = (t: string) => defs.get(t);

function step(type: string, enabled = true, options = {}): StepInstance {
  return { id: type + Math.random(), type, enabled, options };
}

const t = (s: string): Value => text(s);

describe('evaluate', () => {
  const tests: { name: string; input: string; chain: StepInstance[]; want: Evaluation }[] = [
    {
      name: 'empty chain passes input through',
      input: '{"a":1}',
      chain: [],
      want: { results: [], output: { ok: true, value: t('{"a":1}') } },
    },
    {
      name: 'single step runs',
      input: 'ab',
      chain: [step('test.upper')],
      want: { results: [{ status: 'ok', value: t('AB') }], output: { ok: true, value: t('AB') } },
    },
    {
      name: 'disabled step passes through',
      input: 'ab',
      chain: [step('test.upper', false)],
      want: {
        results: [{ status: 'disabled', value: t('ab') }],
        output: { ok: true, value: t('ab') },
      },
    },
    {
      name: 'error stops chain and skips later steps',
      input: 'x',
      chain: [step('test.failx'), step('test.upper'), step('test.upper', false)],
      want: {
        results: [
          { status: 'error', error: 'has x' },
          { status: 'skipped' },
          { status: 'skipped' },
        ],
        output: { ok: false, error: 'has x', index: 0 },
      },
    },
    {
      name: 'recovery after fixing input',
      input: 'y',
      chain: [step('test.failx'), step('test.upper')],
      want: {
        results: [
          { status: 'ok', value: t('y') },
          { status: 'ok', value: t('Y') },
        ],
        output: { ok: true, value: t('Y') },
      },
    },
    {
      name: 'options are applied and invalid ones fall back to defaults',
      input: 'a',
      chain: [step('test.suffix', true, { s: '?' }), step('test.suffix', true, { s: 'bad' })],
      want: {
        results: [
          { status: 'ok', value: t('a?') },
          { status: 'ok', value: t('a?!') },
        ],
        output: { ok: true, value: t('a?!') },
      },
    },
    {
      name: 'unknown step type is an error',
      input: 'a',
      chain: [step('nope')],
      want: {
        results: [{ status: 'error', error: 'unknown step "nope"' }],
        output: { ok: false, error: 'unknown step "nope"', index: 0 },
      },
    },
    {
      name: 'thrown error becomes step error',
      input: 'a',
      chain: [step('test.upper'), step('test.throws')],
      want: {
        results: [
          { status: 'ok', value: t('A') },
          { status: 'error', error: 'boom' },
        ],
        output: { ok: false, error: 'boom', index: 1 },
      },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(evaluate(t(tt.input), tt.chain, lookup)).toEqual(tt.want);
    });
  }
});

describe('text options', () => {
  it('decodes escapes for the step and keeps the typed form on the instance', () => {
    let seen = '';
    const join: StepDef = {
      type: 'test.text',
      name: 'Text',
      keywords: [],
      defaults: { sep: ',' },
      options: [{ kind: 'text', key: 'sep', label: 'Sep', maxLength: 100 }],
      run: (v, o) => {
        seen = String(o.sep);
        return { ok: true, value: v };
      },
    };
    const s = step('test.text', true, { sep: '\\t' });
    evaluate(t('a'), [s], () => join);
    expect(seen).toBe('\t');
    expect(s.options).toEqual({ sep: '\\t' });
  });
});
