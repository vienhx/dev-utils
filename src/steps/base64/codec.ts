const STANDARD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const URL_SAFE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

// Maps a char code to its 6-bit value; both alphabets decode, -1 means invalid.
const DECODE = new Int8Array(128).fill(-1);
for (let i = 0; i < 64; i++) {
  DECODE[STANDARD.charCodeAt(i)] = i;
  DECODE[URL_SAFE.charCodeAt(i)] = i;
}

export const INVALID = 'invalid Base64';

/** Encodes bytes as standard padded Base64, or URL-safe without padding. */
export function encodeBase64(data: Uint8Array, urlSafe = false): string {
  const abc = urlSafe ? URL_SAFE : STANDARD;
  let out = '';
  let i = 0;
  for (; i + 2 < data.length; i += 3) {
    const n = (data[i]! << 16) | (data[i + 1]! << 8) | data[i + 2]!;
    out += abc[n >> 18]! + abc[(n >> 12) & 63]! + abc[(n >> 6) & 63]! + abc[n & 63]!;
  }
  const rest = data.length - i;
  if (rest === 1) {
    const n = data[i]! << 16;
    out += abc[n >> 18]! + abc[(n >> 12) & 63]! + (urlSafe ? '' : '==');
  } else if (rest === 2) {
    const n = (data[i]! << 16) | (data[i + 1]! << 8);
    out += abc[n >> 18]! + abc[(n >> 12) & 63]! + abc[(n >> 6) & 63]! + (urlSafe ? '' : '=');
  }
  return out;
}

function isWhitespace(code: number): boolean {
  return code === 0x20 || (code >= 0x09 && code <= 0x0d);
}

/**
 * Decodes Base64 in either alphabet. Whitespace anywhere and missing padding are accepted;
 * any other character, misplaced padding, or a final group of one character is an error.
 */
export function decodeBase64(
  src: string,
): { ok: true; bytes: Uint8Array } | { ok: false; error: string } {
  const values: number[] = [];
  let padding = 0;
  for (let i = 0; i < src.length; i++) {
    const code = src.charCodeAt(i);
    if (isWhitespace(code)) continue;
    if (code === 0x3d /* = */) {
      padding += 1;
      continue;
    }
    const v = code < 128 ? (DECODE[code] as number) : -1;
    if (v < 0 || padding > 0) {
      const what =
        v < 0
          ? `unexpected character '${String.fromCodePoint(src.codePointAt(i) ?? code)}'`
          : `data after padding`;
      return { ok: false, error: `${INVALID}: ${what} at position ${i + 1}` };
    }
    values.push(v);
  }

  const tail = values.length % 4;
  if (tail === 1) return { ok: false, error: `${INVALID}: impossible length` };
  if (padding > 0 && (tail === 0 || padding !== 4 - tail)) {
    return { ok: false, error: `${INVALID}: wrong padding` };
  }

  const out = new Uint8Array(Math.floor((values.length * 3) / 4));
  let o = 0;
  let i = 0;
  for (; i + 3 < values.length; i += 4) {
    const n = (values[i]! << 18) | (values[i + 1]! << 12) | (values[i + 2]! << 6) | values[i + 3]!;
    out[o++] = n >> 16;
    out[o++] = (n >> 8) & 255;
    out[o++] = n & 255;
  }
  if (tail === 2) {
    out[o] = (values[i]! << 2) | (values[i + 1]! >> 4);
  } else if (tail === 3) {
    const n = (values[i]! << 18) | (values[i + 1]! << 12) | (values[i + 2]! << 6);
    out[o] = n >> 16;
    out[o + 1] = (n >> 8) & 255;
  }
  return { ok: true, bytes: out };
}
