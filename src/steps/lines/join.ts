import type { StepDef } from '../../core/step';
import { asText, text } from '../../core/value';
import { splitLines } from './split';

export const linesJoin: StepDef<{ separator: string }> = {
  type: 'lines.join',
  name: 'Join lines',
  keywords: ['compact', 'one line', 'separator', 'csv', 'implode'],
  defaults: { separator: ', ' },
  options: [{ kind: 'text', key: 'separator', label: 'Separator', maxLength: 100 }],
  run(input, opts) {
    const t = asText(input);
    if (!t.ok) return t;
    return { ok: true, value: text(splitLines(t.text).join(opts.separator)) };
  },
};
