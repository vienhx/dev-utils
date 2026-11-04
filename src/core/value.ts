/** A value passed between steps: either text or raw bytes. */
export type Value = { kind: 'text'; text: string } | { kind: 'bytes'; bytes: Uint8Array };

export type TextResult = { ok: true; text: string } | { ok: false; error: string };

export const NOT_UTF8 = 'input is not valid UTF-8 text';

/** Number of bytes shown in a binary hex preview. */
export const HEX_PREVIEW_LIMIT = 256;

const encoder = new TextEncoder();
const strictDecoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

export function text(value: string): Value {
  return { kind: 'text', text: value };
}

export function bytes(value: Uint8Array): Value {
  return { kind: 'bytes', bytes: value };
}

/** Returns the value as text, decoding bytes as strict UTF-8. */
export function asText(value: Value): TextResult {
  if (value.kind === 'text') return { ok: true, text: value.text };
  try {
    return { ok: true, text: strictDecoder.decode(value.bytes) };
  } catch {
    return { ok: false, error: NOT_UTF8 };
  }
}

/** Returns the value as bytes, encoding text as UTF-8. */
export function asBytes(value: Value): Uint8Array {
  return value.kind === 'bytes' ? value.bytes : encoder.encode(value.text);
}

/** Space-separated lowercase hex of the first `limit` bytes. */
export function hexPreview(data: Uint8Array, limit = HEX_PREVIEW_LIMIT): string {
  const parts: string[] = [];
  const end = Math.min(data.length, limit);
  for (let i = 0; i < end; i++) {
    parts.push((data[i] ?? 0).toString(16).padStart(2, '0'));
  }
  return parts.join(' ');
}

export type Display =
  | { kind: 'text'; text: string }
  | { kind: 'binary'; length: number; hex: string; truncated: boolean };

/** How a value should be shown to the user: as text if possible, otherwise as a hex preview. */
export function display(value: Value): Display {
  const t = asText(value);
  if (t.ok) return { kind: 'text', text: t.text };
  const data = asBytes(value);
  return {
    kind: 'binary',
    length: data.length,
    hex: hexPreview(data),
    truncated: data.length > HEX_PREVIEW_LIMIT,
  };
}
