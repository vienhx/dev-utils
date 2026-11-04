import type { StepDef } from '../../core/step';
import { asText, text } from '../../core/value';
import { scanStringContent, tokenize, type Token } from './tokenizer';

const LEADING_WS = /^[ \t\n\r]*/;
const TRAILING_WS = /[ \t\n\r]*$/;

export const jsonUnescape: StepDef<Record<string, never>> = {
  type: 'json.unescape',
  name: 'JSON unescape',
  keywords: ['unquote', 'unstringify', 'string'],
  defaults: {},
  options: [],
  run(input) {
    const t = asText(input);
    if (!t.ok) return t;
    const src = t.text;
    const start = (LEADING_WS.exec(src) as RegExpExecArray)[0].length;
    const body = src.slice(start).replace(TRAILING_WS, '');
    if (body === '') return { ok: true, value: text('') };

    let literal: string;
    if (body.startsWith('"')) {
      // The tokenizer skips the same outer whitespace, so positions stay in the original input.
      const r = tokenize(src);
      if (!r.ok) return r;
      literal = (r.tokens[0] as Token).text;
    } else {
      const r = scanStringContent(body, src, start);
      if (!r.ok) return r;
      literal = `"${body}"`;
    }
    return { ok: true, value: text(JSON.parse(literal) as string) };
  },
};
