import type { StepDef } from '../../core/step';
import { asText, text } from '../../core/value';
import { splitLines } from './split';

type Escape = 'backslash' | 'double' | 'none';

// split/join so the user's text is never read as a pattern.
function escapeLine(line: string, after: string, mode: Escape): string {
  if (after === '' || mode === 'none') return line;
  if (mode === 'double') return line.split(after).join(after + after);
  return line
    .split('\\')
    .join('\\\\')
    .split(after)
    .join('\\' + after);
}

export const linesQuote: StepDef<{ before: string; after: string; escape: Escape }> = {
  type: 'lines.quote',
  name: 'Quote lines',
  keywords: ['wrap', 'string', 'escape'],
  defaults: { before: '"', after: '"', escape: 'backslash' },
  options: [
    { kind: 'text', key: 'before', label: 'Before', maxLength: 100 },
    { kind: 'text', key: 'after', label: 'After', maxLength: 100 },
    {
      kind: 'select',
      key: 'escape',
      label: 'Escape',
      choices: [
        { value: 'backslash', label: 'Backslash' },
        { value: 'double', label: 'Double' },
        { value: 'none', label: 'None' },
      ],
    },
  ],
  run(input, opts) {
    const t = asText(input);
    if (!t.ok) return t;
    const lines = splitLines(t.text).map(
      (l) => opts.before + escapeLine(l, opts.after, opts.escape) + opts.after,
    );
    return { ok: true, value: text(lines.join('\n')) };
  },
};
