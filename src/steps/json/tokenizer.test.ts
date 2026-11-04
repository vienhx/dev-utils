import { describe, expect, it } from 'vitest';
import { corpus } from './fixtures/corpus';
import { position, scanStringContent, tokenize } from './tokenizer';

function parses(src: string): boolean {
  try {
    JSON.parse(src);
    return true;
  } catch {
    return false;
  }
}

describe('tokenize edge cases', () => {
  const tests: { name: string; src: string; error?: string }[] = [
    { name: 'empty object', src: '{}' },
    { name: 'nested containers', src: '{"a":[1,{"b":[]}],"c":{}}' },
    { name: 'all escapes', src: '"\\" \\\\ \\/ \\b \\f \\n \\r \\t \\u00e9"' },
    { name: 'surrogate pair escape', src: '"\\uD83D\\uDE00"' },
    { name: 'lone surrogate escape is allowed', src: '"\\uD800"' },
    { name: 'exponents', src: '[1e5,1E-5,1e+5,-0.0e0]' },
    { name: 'big integer', src: '12345678901234567890' },
    { name: 'leading zero', src: '01', error: 'Invalid number at line 1, column 1' },
    { name: 'trailing decimal point', src: '[1.]', error: 'Invalid number at line 1, column 2' },
    { name: 'trailing comma in array', src: '[1,]', error: "Unexpected ']' at line 1, column 4" },
    {
      name: 'trailing comma in object',
      src: '{"a":1,}',
      error: "Unexpected '}' at line 1, column 8",
    },
    {
      name: 'missing value on line 2',
      src: '{\n"a": }',
      error: "Unexpected '}' at line 2, column 6",
    },
    {
      name: 'CRLF counts as one line break',
      src: '{\r\n\r\n"a": }',
      error: "Unexpected '}' at line 3, column 6",
    },
    { name: 'unquoted key', src: '{a:1}', error: "Unexpected 'a' at line 1, column 2" },
    { name: 'single quotes', src: "'a'", error: "Unexpected ''' at line 1, column 1" },
    {
      name: 'raw control character in string',
      src: '"a\nb"',
      error: 'Unescaped control character in string at line 1, column 3',
    },
    { name: 'bad escape', src: '"\\x"', error: 'Invalid escape in string at line 1, column 2' },
    {
      name: 'short unicode escape',
      src: '"\\u12"',
      error: 'Invalid \\u escape in string at line 1, column 2',
    },
    {
      name: 'unterminated string',
      src: '  "abc',
      error: 'Unterminated string at line 1, column 3',
    },
    { name: 'empty input', src: '', error: 'Unexpected end of input at line 1, column 1' },
    { name: 'unclosed array', src: '[1,\n2', error: 'Unexpected end of input at line 2, column 2' },
    {
      name: 'second top-level value',
      src: '{} {}',
      error: "Unexpected '{' after JSON value at line 1, column 4",
    },
    { name: 'BOM rejected', src: '﻿1', error: 'Unexpected character U+FEFF at line 1, column 1' },
    {
      name: 'column counts astral characters once',
      src: '["😀" x]',
      error: "Unexpected 'x' at line 1, column 6",
    },
    { name: 'mismatched close', src: '[1}', error: "Unexpected '}' at line 1, column 3" },
    { name: 'missing colon', src: '{"a" 1}', error: 'Unexpected number at line 1, column 6' },
    { name: 'non-string key', src: '{1:1}', error: 'Unexpected number at line 1, column 2' },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const r = tokenize(tt.src);
      if (tt.error) {
        expect(r).toEqual({ ok: false, error: tt.error });
      } else {
        expect(r.ok).toBe(true);
      }
    });
  }

  it('handles deep nesting without recursion', () => {
    const depth = 100_000;
    expect(tokenize('['.repeat(depth) + ']'.repeat(depth)).ok).toBe(true);
    expect(tokenize('['.repeat(depth) + ']'.repeat(depth - 1)).ok).toBe(false);
  });

  it('keeps token text verbatim', () => {
    const r = tokenize('{"\\u0041":1.50E+3}');
    expect(r.ok && r.tokens.map((t) => t.text)).toEqual(['{', '"\\u0041"', ':', '1.50E+3', '}']);
  });
});

describe('position', () => {
  it('handles lone CR line breaks', () => {
    expect(position('a\rb', 2)).toEqual({ line: 2, column: 1 });
  });
});

describe('scanStringContent', () => {
  const tests: { name: string; src: string; base?: number; error?: string }[] = [
    { name: 'valid body', src: 'a\\n\\"b\\u00e9 é' },
    { name: 'empty body', src: '' },
    { name: 'invalid escape', src: 'a\\x', error: 'Invalid escape in string at line 1, column 2' },
    {
      name: 'bad unicode escape',
      src: '\\u12g4',
      error: 'Invalid \\u escape in string at line 1, column 1',
    },
    {
      name: 'raw control character',
      src: 'a\tb',
      error: 'Unescaped control character in string at line 1, column 2',
    },
    { name: 'raw quote', src: '{"a":1}', error: 'Unescaped quote in string at line 1, column 2' },
    {
      name: 'position on line 2',
      src: '\n  a\\x',
      base: 3,
      error: 'Invalid escape in string at line 2, column 4',
    },
    {
      name: 'position after leading whitespace',
      src: '   ab"',
      base: 3,
      error: 'Unescaped quote in string at line 1, column 6',
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const base = tt.base ?? 0;
      const r = scanStringContent(tt.src.slice(base), tt.src, base);
      expect(r).toEqual(tt.error ? { ok: false, error: tt.error } : { ok: true });
    });
  }
});

describe('tokenize agrees with JSON.parse', () => {
  for (const src of corpus) {
    it(JSON.stringify(src), () => {
      expect(tokenize(src).ok).toBe(parses(src));
    });
  }

  it('agrees on seeded random mutations', () => {
    let seed = 42;
    const rand = (n: number) => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed % n;
    };
    const alphabet = '{}[]:,"\\ \n\t0123456789-+.eEtrufalsné';
    const valid = corpus.filter(parses);
    for (let i = 0; i < 5000; i++) {
      let s = valid[rand(valid.length)] as string;
      const edits = 1 + rand(3);
      for (let e = 0; e < edits; e++) {
        const at = rand(s.length + 1);
        const op = rand(3);
        const ch = alphabet[rand(alphabet.length)] as string;
        if (op === 0) s = s.slice(0, at) + ch + s.slice(at);
        else if (op === 1) s = s.slice(0, at) + s.slice(at + 1);
        else s = s.slice(0, at) + ch + s.slice(at + 1);
      }
      if (tokenize(s).ok !== parses(s)) {
        throw new Error(`disagreement on ${JSON.stringify(s)}`);
      }
    }
  });
});
