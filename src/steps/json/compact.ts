import type { StepDef } from '../../core/step';
import { text } from '../../core/value';
import { jsonTokens } from './parse';

export const jsonCompact: StepDef<Record<string, never>> = {
  type: 'json.compact',
  name: 'JSON compact',
  keywords: ['minify', 'min', 'uglify', 'compress'],
  defaults: {},
  options: [],
  run(input) {
    const r = jsonTokens(input);
    if (!r.ok) return r;
    return { ok: true, value: text(r.tokens.map((t) => t.text).join('')) };
  },
};
