import { describe, expect, it } from 'vitest';
import { NOT_UTF8, asBytes, asText, bytes, display, hexPreview, text } from './value';

describe('asText', () => {
  const tests = [
    { name: 'text passes through', input: text('héllo'), want: { ok: true, text: 'héllo' } },
    {
      name: 'valid UTF-8 bytes decode',
      input: bytes(new Uint8Array([0x68, 0xc3, 0xa9])),
      want: { ok: true, text: 'hé' },
    },
    { name: 'empty bytes decode', input: bytes(new Uint8Array()), want: { ok: true, text: '' } },
    {
      name: 'invalid lead byte fails',
      input: bytes(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])),
      want: { ok: false, error: NOT_UTF8 },
    },
    {
      name: 'truncated sequence fails',
      input: bytes(new Uint8Array([0x61, 0xc3])),
      want: { ok: false, error: NOT_UTF8 },
    },
    {
      name: 'BOM is kept',
      input: bytes(new Uint8Array([0xef, 0xbb, 0xbf, 0x61])),
      want: { ok: true, text: '﻿a' },
    },
  ];
  for (const tt of tests) {
    it(tt.name, () => {
      expect(asText(tt.input)).toEqual(tt.want);
    });
  }
});

describe('asBytes', () => {
  it('encodes text as UTF-8', () => {
    expect([...asBytes(text('é'))]).toEqual([0xc3, 0xa9]);
  });
  it('returns bytes unchanged', () => {
    const b = new Uint8Array([1, 2]);
    expect(asBytes(bytes(b))).toBe(b);
  });
});

describe('hexPreview', () => {
  it('formats lowercase pairs', () => {
    expect(hexPreview(new Uint8Array([0xff, 0xd8, 0x0a]))).toBe('ff d8 0a');
  });
  it('caps at 256 bytes', () => {
    const data = new Uint8Array(300).fill(0xab);
    const out = hexPreview(data);
    expect(out.split(' ')).toHaveLength(256);
  });
});

describe('display', () => {
  it('shows valid UTF-8 bytes as text', () => {
    expect(display(bytes(new TextEncoder().encode('hello')))).toEqual({
      kind: 'text',
      text: 'hello',
    });
  });
  it('shows binary with length and hex', () => {
    expect(display(bytes(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])))).toEqual({
      kind: 'binary',
      length: 4,
      hex: 'ff d8 ff e0',
      truncated: false,
    });
  });
  it('marks long binary as truncated', () => {
    const d = display(bytes(new Uint8Array(257).fill(0xff)));
    expect(d.kind === 'binary' && d.truncated).toBe(true);
  });
});
