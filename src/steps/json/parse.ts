import { asText, type Value } from '../../core/value';
import { tokenize, type Token } from './tokenizer';

/** Decodes the value as UTF-8 text and tokenizes it as JSON. */
export function jsonTokens(
  input: Value,
): { ok: true; tokens: Token[] } | { ok: false; error: string } {
  const t = asText(input);
  if (!t.ok) return t;
  return tokenize(t.text);
}
