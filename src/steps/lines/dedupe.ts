import type { StepDef } from '../../core/step';
import { asText, text } from '../../core/value';
import { splitLines } from './split';

export const linesDedupe: StepDef<{ trim: 'keep' | 'trim'; case: 'sensitive' | 'ignore' }> = {
  type: 'lines.dedupe',
  name: 'Remove duplicate lines',
  keywords: ['unique', 'distinct', 'duplicate'],
  defaults: { trim: 'keep', case: 'sensitive' },
  options: [
    {
      kind: 'select',
      key: 'trim',
      label: 'Whitespace',
      choices: [
        { value: 'keep', label: 'Keep' },
        { value: 'trim', label: 'Trim' },
      ],
    },
    {
      kind: 'select',
      key: 'case',
      label: 'Case',
      choices: [
        { value: 'sensitive', label: 'Sensitive' },
        { value: 'ignore', label: 'Ignore' },
      ],
    },
  ],
  run(input, opts) {
    const t = asText(input);
    if (!t.ok) return t;
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of splitLines(t.text)) {
      const line = opts.trim === 'trim' ? raw.trim() : raw;
      const key = opts.case === 'ignore' ? line.toLowerCase() : line;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(line);
    }
    return { ok: true, value: text(out.join('\n')) };
  },
};
