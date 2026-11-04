import { describe, expect, it } from 'vitest';
import type { StepDef, StepOptions } from '../../core/step';
import { NOT_UTF8, bytes, text, type Value } from '../../core/value';
import { jsonCompact } from './compact';
import { jsonEscape } from './escape';
import { jsonFormat } from './format';
import { jsonUnescape } from './unescape';
import { jsonValidate } from './validate';

const enc = new TextEncoder();

function run(def: StepDef, input: Value, opts: StepOptions = {}) {
  return def.run(input, { ...def.defaults, ...opts });
}

describe('JSON steps', () => {
  const tests: {
    name: string;
    def: StepDef;
    input: Value;
    opts?: StepOptions;
    want: { value: Value } | { error: string | RegExp };
  }[] = [
    {
      name: 'validate passes valid JSON through unchanged',
      def: jsonValidate,
      input: text('{ "a": 1 }'),
      want: { value: text('{ "a": 1 }') },
    },
    {
      name: 'validate reports line and column',
      def: jsonValidate,
      input: text('{\n"a": }'),
      want: { error: "Unexpected '}' at line 2, column 6" },
    },
    {
      name: 'compact removes whitespace',
      def: jsonCompact,
      input: text('{\n  "a": [1, 2]\n}'),
      want: { value: text('{"a":[1,2]}') },
    },
    {
      name: 'compact invalid JSON reports position',
      def: jsonCompact,
      input: text('{"a":}'),
      want: { error: /line 1, column 6/ },
    },
    {
      name: 'compact keeps key order',
      def: jsonCompact,
      input: text('{"b":1,"a":2,"2":3}'),
      want: { value: text('{"b":1,"a":2,"2":3}') },
    },
    {
      name: 'compact keeps large integers',
      def: jsonCompact,
      input: text('{"id":12345678901234567890}'),
      want: { value: text('{"id":12345678901234567890}') },
    },
    {
      name: 'compact keeps string escapes',
      def: jsonCompact,
      input: text('[ "\\u00e9\\n" ]'),
      want: { value: text('["\\u00e9\\n"]') },
    },
    {
      name: 'format default indent is 2 spaces',
      def: jsonFormat,
      input: text('{"a":1}'),
      want: { value: text('{\n  "a": 1\n}') },
    },
    {
      name: 'format with 4 spaces',
      def: jsonFormat,
      input: text('{"a":[1,{}],"b":[]}'),
      opts: { indent: '4' },
      want: { value: text('{\n    "a": [\n        1,\n        {}\n    ],\n    "b": []\n}') },
    },
    {
      name: 'format with tab',
      def: jsonFormat,
      input: text('{"a":1}'),
      opts: { indent: 'tab' },
      want: { value: text('{\n\t"a": 1\n}') },
    },
    {
      name: 'format scalar',
      def: jsonFormat,
      input: text('  "x"  '),
      want: { value: text('"x"') },
    },
    {
      name: 'format invalid JSON reports position',
      def: jsonFormat,
      input: text('[1,]'),
      want: { error: /line 1, column 4/ },
    },
    {
      name: 'format decodes UTF-8 bytes',
      def: jsonFormat,
      input: bytes(enc.encode('{"a":1}')),
      want: { value: text('{\n  "a": 1\n}') },
    },
    {
      name: 'format rejects non-UTF-8 bytes',
      def: jsonFormat,
      input: bytes(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])),
      want: { error: NOT_UTF8 },
    },
    {
      name: 'validate rejects non-UTF-8 bytes',
      def: jsonValidate,
      input: bytes(new Uint8Array([0xc3])),
      want: { error: NOT_UTF8 },
    },
    {
      name: 'compact rejects non-UTF-8 bytes',
      def: jsonCompact,
      input: bytes(new Uint8Array([0x80])),
      want: { error: NOT_UTF8 },
    },
    {
      name: 'escape with quotes by default',
      def: jsonEscape,
      input: text('say "hi"\n'),
      want: { value: text('"say \\"hi\\"\\n"') },
    },
    {
      name: 'escape without quotes',
      def: jsonEscape,
      input: text('a\\b\t'),
      opts: { quotes: 'omit' },
      want: { value: text('a\\\\b\\t') },
    },
    {
      name: 'escape keeps non-ASCII',
      def: jsonEscape,
      input: text('héllo 👋'),
      want: { value: text('"héllo 👋"') },
    },
    {
      name: 'escape empty with quotes',
      def: jsonEscape,
      input: text(''),
      want: { value: text('""') },
    },
    {
      name: 'escape empty without quotes',
      def: jsonEscape,
      input: text(''),
      opts: { quotes: 'omit' },
      want: { value: text('') },
    },
    {
      name: 'escape does not trim',
      def: jsonEscape,
      input: text(' a '),
      want: { value: text('" a "') },
    },
    {
      name: 'escape rejects non-UTF-8 bytes',
      def: jsonEscape,
      input: bytes(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])),
      want: { error: NOT_UTF8 },
    },
    {
      name: 'unescape quoted literal',
      def: jsonUnescape,
      input: text('"{\\"a\\":1}"'),
      want: { value: text('{"a":1}') },
    },
    {
      name: 'unescape without quotes',
      def: jsonUnescape,
      input: text('line1\\nline2 é'),
      want: { value: text('line1\nline2 é') },
    },
    {
      name: 'unescape ignores surrounding whitespace',
      def: jsonUnescape,
      input: text('"a\\tb"\n'),
      want: { value: text('a\tb') },
    },
    {
      name: 'unescape empty input',
      def: jsonUnescape,
      input: text(''),
      want: { value: text('') },
    },
    {
      name: 'unescape whitespace-only input',
      def: jsonUnescape,
      input: text(' \n\t '),
      want: { value: text('') },
    },
    {
      name: 'unescape invalid escape',
      def: jsonUnescape,
      input: text('"a\\x"'),
      want: { error: 'Invalid escape in string at line 1, column 3' },
    },
    {
      name: 'unescape raw quote in content without quotes',
      def: jsonUnescape,
      input: text('{"a":1}'),
      want: { error: 'Unescaped quote in string at line 1, column 2' },
    },
    {
      name: 'unescape content after closing quote',
      def: jsonUnescape,
      input: text('"a" b'),
      want: { error: /line 1, column 5/ },
    },
    {
      name: 'unescape missing closing quote',
      def: jsonUnescape,
      input: text('"abc'),
      want: { error: /^Unterminated string/ },
    },
    {
      name: 'unescape reports position in original input',
      def: jsonUnescape,
      input: text('\n  a\\x'),
      want: { error: 'Invalid escape in string at line 2, column 4' },
    },
    {
      name: 'unescape decodes UTF-8 bytes',
      def: jsonUnescape,
      input: bytes(enc.encode('"a\\nb"')),
      want: { value: text('a\nb') },
    },
    {
      name: 'unescape rejects non-UTF-8 bytes',
      def: jsonUnescape,
      input: bytes(new Uint8Array([0x80])),
      want: { error: NOT_UTF8 },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const r = run(tt.def, tt.input, tt.opts);
      if ('value' in tt.want) {
        expect(r).toEqual({ ok: true, value: tt.want.value });
      } else {
        expect(r.ok).toBe(false);
        if (!r.ok) {
          if (typeof tt.want.error === 'string') expect(r.error).toBe(tt.want.error);
          else expect(r.error).toMatch(tt.want.error);
        }
      }
    });
  }

  for (const quotes of ['include', 'omit']) {
    it(`escape then unescape round-trips with quotes ${quotes}`, () => {
      const input = 'say "hi"\né';
      const escaped = run(jsonEscape, text(input), { quotes });
      expect(escaped.ok && run(jsonUnescape, escaped.value)).toEqual({
        ok: true,
        value: text(input),
      });
    });
  }

  it('format output matches JSON.stringify for plain documents', () => {
    const doc = { a: [1, 2, { b: null, c: 'x' }], d: {}, e: [], f: true };
    const src = JSON.stringify(doc);
    expect(run(jsonFormat, text(src))).toEqual({
      ok: true,
      value: text(JSON.stringify(doc, null, 2)),
    });
  });
});
