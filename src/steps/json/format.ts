import type { StepDef } from '../../core/step';
import { text } from '../../core/value';
import { jsonTokens } from './parse';
import type { Token } from './tokenizer';

type Indent = '2' | '4' | 'tab';

const INDENTS: Record<Indent, string> = { '2': '  ', '4': '    ', tab: '\t' };

/** Re-emits tokens pretty-printed, keeping empty containers on one line like JSON.stringify. */
export function formatTokens(tokens: Token[], unit: string): string {
  let out = '';
  let depth = 0;
  const newline = () => '\n' + unit.repeat(depth);
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i] as Token;
    const next = tokens[i + 1];
    switch (tok.type) {
      case '{':
      case '[':
        if (next && (next.type === '}' || next.type === ']')) {
          out += tok.text + next.text;
          i += 1;
        } else {
          depth += 1;
          out += tok.text + newline();
        }
        break;
      case '}':
      case ']':
        depth -= 1;
        out += newline() + tok.text;
        break;
      case ',':
        out += ',' + newline();
        break;
      case ':':
        out += ': ';
        break;
      default:
        out += tok.text;
    }
  }
  return out;
}

export const jsonFormat: StepDef<{ indent: Indent }> = {
  type: 'json.format',
  name: 'JSON format',
  keywords: ['pretty', 'beautify', 'prettify', 'indent'],
  defaults: { indent: '2' },
  options: [
    {
      kind: 'select',
      key: 'indent',
      label: 'Indent',
      choices: [
        { value: '2', label: '2 spaces' },
        { value: '4', label: '4 spaces' },
        { value: 'tab', label: 'Tab' },
      ],
    },
  ],
  run(input, opts) {
    const r = jsonTokens(input);
    if (!r.ok) return r;
    return { ok: true, value: text(formatTokens(r.tokens, INDENTS[opts.indent])) };
  },
};
