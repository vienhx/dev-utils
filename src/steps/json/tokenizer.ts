/** Significant JSON token. `text` is copied verbatim from the source, so output stays lossless. */
export type Token = {
  type: '{' | '}' | '[' | ']' | ':' | ',' | 'string' | 'number' | 'literal';
  text: string;
};

export type TokenizeResult = { ok: true; tokens: Token[] } | { ok: false; error: string };

type State = 'value' | 'valueOrEnd' | 'key' | 'keyOrEnd' | 'colon' | 'commaOrEnd' | 'done';

class JsonError extends Error {
  constructor(
    message: string,
    readonly offset: number,
  ) {
    super(message);
  }
}

const NUMBER = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y;
const HEX4 = /[0-9a-fA-F]{4}/y;
const LITERALS = ['true', 'false', 'null'];
const ESCAPES = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't']);

function isWhitespace(c: string | undefined): boolean {
  return c === ' ' || c === '\t' || c === '\n' || c === '\r';
}

/** 1-based line and column (in code points) of an offset. Accepts \n, \r\n, and \r line breaks. */
export function position(src: string, offset: number): { line: number; column: number } {
  let line = 1;
  let column = 1;
  for (let i = 0; i < offset && i < src.length; i++) {
    const c = src.charCodeAt(i);
    if (c === 0x0a || (c === 0x0d && src.charCodeAt(i + 1) !== 0x0a)) {
      line += 1;
      column = 1;
    } else if (c === 0x0d) {
      // \r of a \r\n pair: the \n ends the line.
    } else if (c >= 0xdc00 && c <= 0xdfff && i > 0) {
      const prev = src.charCodeAt(i - 1);
      if (prev < 0xd800 || prev > 0xdbff) column += 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}

function describe(c: string): string {
  const code = c.codePointAt(0) ?? 0;
  if (code < 0x20 || code === 0x7f || code === 0xfeff) {
    return `character U+${code.toString(16).toUpperCase().padStart(4, '0')}`;
  }
  return `'${String.fromCodePoint(code)}'`;
}

/** Index after the character or escape at `i`. Throws on invalid escapes and raw control characters. */
function readChar(src: string, i: number): number {
  const c = src[i] as string;
  if (c === '\\') {
    const e = src[i + 1];
    if (e === 'u') {
      HEX4.lastIndex = i + 2;
      if (!HEX4.test(src)) throw new JsonError('Invalid \\u escape in string', i);
      return i + 6;
    }
    if (e !== undefined && ESCAPES.has(e)) return i + 2;
    throw new JsonError(e === undefined ? 'Unterminated string' : 'Invalid escape in string', i);
  }
  if (c.charCodeAt(0) < 0x20) throw new JsonError('Unescaped control character in string', i);
  return i + 1;
}

function readString(src: string, start: number): number {
  let i = start + 1;
  while (i < src.length) {
    if (src[i] === '"') return i + 1;
    i = readChar(src, i);
  }
  throw new JsonError('Unterminated string', start);
}

function readToken(src: string, i: number): Token {
  const c = src[i] as string;
  switch (c) {
    case '{':
    case '}':
    case '[':
    case ']':
    case ':':
    case ',':
      return { type: c, text: c };
    case '"':
      return { type: 'string', text: src.slice(i, readString(src, i)) };
  }
  if (c === '-' || (c >= '0' && c <= '9')) {
    NUMBER.lastIndex = i;
    const m = NUMBER.exec(src);
    const end = m ? i + m[0].length : i;
    // A number must not run straight into more digits or number characters (e.g. 01, 1., 1e).
    const next = src[end];
    if (!m || (next !== undefined && /[0-9.eE+-]/.test(next))) {
      throw new JsonError('Invalid number', i);
    }
    return { type: 'number', text: m[0] };
  }
  for (const lit of LITERALS) {
    if (src.startsWith(lit, i)) return { type: 'literal', text: lit };
  }
  throw new JsonError(`Unexpected ${describe(src.slice(i, i + 2))}`, i);
}

function unexpected(tok: Token, offset: number): JsonError {
  if (tok.type === 'string') return new JsonError('Unexpected string', offset);
  if (tok.type === 'number') return new JsonError('Unexpected number', offset);
  return new JsonError(`Unexpected '${tok.text}'`, offset);
}

function scan(src: string): Token[] {
  const tokens: Token[] = [];
  const stack: ('{' | '[')[] = [];
  let state: State = 'value';
  let i = 0;

  const afterValue = (): State => (stack.length > 0 ? 'commaOrEnd' : 'done');

  for (;;) {
    while (isWhitespace(src[i])) i += 1;
    if (i >= src.length) {
      if (state === 'done') return tokens;
      throw new JsonError('Unexpected end of input', i);
    }
    if (state === 'done') {
      throw new JsonError(`Unexpected ${describe(src.slice(i, i + 2))} after JSON value`, i);
    }

    const tok = readToken(src, i);
    const at = i;
    i += tok.text.length;
    tokens.push(tok);
    const top = stack[stack.length - 1];

    switch (state) {
      case 'value':
      case 'valueOrEnd':
        if (state === 'valueOrEnd' && tok.type === ']') {
          stack.pop();
          state = afterValue();
        } else if (tok.type === 'string' || tok.type === 'number' || tok.type === 'literal') {
          state = afterValue();
        } else if (tok.type === '{') {
          stack.push('{');
          state = 'keyOrEnd';
        } else if (tok.type === '[') {
          stack.push('[');
          state = 'valueOrEnd';
        } else {
          throw unexpected(tok, at);
        }
        break;
      case 'key':
      case 'keyOrEnd':
        if (state === 'keyOrEnd' && tok.type === '}') {
          stack.pop();
          state = afterValue();
        } else if (tok.type === 'string') {
          state = 'colon';
        } else {
          throw unexpected(tok, at);
        }
        break;
      case 'colon':
        if (tok.type !== ':') throw unexpected(tok, at);
        state = 'value';
        break;
      case 'commaOrEnd':
        if (tok.type === ',') {
          state = top === '{' ? 'key' : 'value';
        } else if ((top === '{' && tok.type === '}') || (top === '[' && tok.type === ']')) {
          stack.pop();
          state = afterValue();
        } else {
          throw unexpected(tok, at);
        }
        break;
    }
  }
}

/** Turns a JsonError into a message with line and column in `src`, where offsets start at `base`. */
function failure(e: unknown, src: string, base: number): { ok: false; error: string } {
  if (!(e instanceof JsonError)) throw e;
  const { line, column } = position(src, base + e.offset);
  return { ok: false, error: `${e.message} at line ${line}, column ${column}` };
}

/** Validates JSON text and returns its significant tokens, or an error with line and column. */
export function tokenize(src: string): TokenizeResult {
  try {
    return { ok: true, tokens: scan(src) };
  } catch (e) {
    return failure(e, src, 0);
  }
}

/**
 * Validates the content of a JSON string given without its surrounding quotes.
 * Errors give the line and column in `src`, where the content starts at offset `base`.
 */
export function scanStringContent(
  content: string,
  src: string,
  base: number,
): { ok: true } | { ok: false; error: string } {
  try {
    for (let i = 0; i < content.length;) {
      if (content[i] === '"') throw new JsonError('Unescaped quote in string', i);
      i = readChar(content, i);
    }
    return { ok: true };
  } catch (e) {
    return failure(e, src, base);
  }
}
