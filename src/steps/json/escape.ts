import type { StepDef } from '../../core/step';
import { asText, text } from '../../core/value';

export const jsonEscape: StepDef<{ quotes: 'include' | 'omit' }> = {
  type: 'json.escape',
  name: 'JSON escape',
  keywords: ['stringify', 'quote', 'string'],
  defaults: { quotes: 'include' },
  options: [
    {
      kind: 'select',
      key: 'quotes',
      label: 'Quotes',
      choices: [
        { value: 'include', label: 'Include' },
        { value: 'omit', label: 'Omit' },
      ],
    },
  ],
  run(input, opts) {
    const t = asText(input);
    if (!t.ok) return t;
    const literal = JSON.stringify(t.text);
    return { ok: true, value: text(opts.quotes === 'omit' ? literal.slice(1, -1) : literal) };
  },
};
