import type { StepDef } from '../../core/step';
import { asText, text } from '../../core/value';

export const textWrap: StepDef<{ open: string; close: string }> = {
  type: 'text.wrap',
  name: 'Wrap',
  keywords: ['array', 'brackets', 'list', 'in'],
  defaults: { open: '[', close: ']' },
  options: [
    { kind: 'text', key: 'open', label: 'Open', maxLength: 100 },
    { kind: 'text', key: 'close', label: 'Close', maxLength: 100 },
  ],
  run(input, opts) {
    const t = asText(input);
    if (!t.ok) return t;
    return { ok: true, value: text(opts.open + t.text + opts.close) };
  },
};
