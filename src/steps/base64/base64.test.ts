import { describe, expect, it } from 'vitest';
import { bytes, text, type Value } from '../../core/value';
import { INVALID, decodeBase64, encodeBase64 } from './codec';
import { base64Decode } from './decode';
import { base64Encode } from './encode';

const enc = new TextEncoder();

describe('Base64 encode step', () => {
  const tests: { name: string; input: Value; variant: 'standard' | 'url'; want: string }[] = [
    { name: 'Unicode text as UTF-8', input: text('héllo'), variant: 'standard', want: 'aMOpbGxv' },
    { name: 'ASCII', input: text('abc'), variant: 'standard', want: 'YWJj' },
    { name: 'one byte pads twice', input: text('a'), variant: 'standard', want: 'YQ==' },
    { name: 'two bytes pad once', input: text('ab'), variant: 'standard', want: 'YWI=' },
    {
      name: 'URL-safe bytes',
      input: bytes(new Uint8Array([0xfb, 0xff])),
      variant: 'url',
      want: '-_8',
    },
    {
      name: 'standard bytes',
      input: bytes(new Uint8Array([0xfb, 0xff])),
      variant: 'standard',
      want: '+/8=',
    },
    { name: 'empty input', input: text(''), variant: 'standard', want: '' },
    { name: 'empty input URL-safe', input: text(''), variant: 'url', want: '' },
  ];
  for (const tt of tests) {
    it(tt.name, () => {
      expect(base64Encode.run(tt.input, { variant: tt.variant })).toEqual({
        ok: true,
        value: text(tt.want),
      });
    });
  }
});

describe('Base64 decode step', () => {
  const tests: { name: string; input: string; want: number[] | string }[] = [
    { name: 'padded', input: 'aGVsbG8=', want: [...enc.encode('hello')] },
    { name: 'line breaks', input: 'aGVs\nbG8=', want: [...enc.encode('hello')] },
    {
      name: 'surrounding whitespace',
      input: '  aGVs\r\n\tbG8=  \n',
      want: [...enc.encode('hello')],
    },
    { name: 'missing padding', input: 'aGVsbG8', want: [...enc.encode('hello')] },
    { name: 'URL-safe without padding', input: '-_8', want: [0xfb, 0xff] },
    { name: 'mixed alphabets', input: '+_8-', want: [0xfb, 0xff, 0x3e] },
    { name: 'binary', input: '/9j/4A==', want: [0xff, 0xd8, 0xff, 0xe0] },
    { name: 'empty input', input: '', want: [] },
    { name: 'only whitespace', input: ' \n ', want: [] },
    {
      name: 'invalid character',
      input: 'aGVs*bG8=',
      want: `${INVALID}: unexpected character '*' at position 5`,
    },
    {
      name: 'non-ASCII character',
      input: 'aGé',
      want: `${INVALID}: unexpected character 'é' at position 3`,
    },
    { name: 'impossible length', input: 'a', want: `${INVALID}: impossible length` },
    {
      name: 'impossible length after groups',
      input: 'YWJjZ',
      want: `${INVALID}: impossible length`,
    },
    {
      name: 'padding in the middle',
      input: 'YQ==YQ==',
      want: `${INVALID}: data after padding at position 5`,
    },
    { name: 'too much padding', input: 'YQ===', want: `${INVALID}: wrong padding` },
    { name: 'padding on full group', input: 'YWJj=', want: `${INVALID}: wrong padding` },
    { name: 'padding alone', input: '==', want: `${INVALID}: wrong padding` },
  ];
  for (const tt of tests) {
    it(tt.name, () => {
      const r = base64Decode.run(text(tt.input), {});
      if (typeof tt.want === 'string') {
        expect(r).toEqual({ ok: false, error: tt.want });
      } else {
        expect(r).toEqual({ ok: true, value: bytes(new Uint8Array(tt.want)) });
      }
    });
  }

  it('decodes text that arrives as UTF-8 bytes', () => {
    expect(base64Decode.run(bytes(enc.encode('YWJj')), {})).toEqual({
      ok: true,
      value: bytes(enc.encode('abc')),
    });
  });
});

describe('codec round trip', () => {
  it('matches btoa and round-trips every length up to 300', () => {
    for (let n = 0; n <= 300; n++) {
      const data = new Uint8Array(n).map((_, i) => (i * 37 + n) & 255);
      const b64 = encodeBase64(data);
      expect(b64).toBe(btoa(String.fromCharCode(...data)));
      const back = decodeBase64(encodeBase64(data, true));
      expect(back.ok && [...back.bytes]).toEqual([...data]);
    }
  });
});
