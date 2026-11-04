import type { StepDef } from '../../core/step';
import { jsonTokens } from './parse';

export const jsonValidate: StepDef<Record<string, never>> = {
  type: 'json.validate',
  name: 'JSON validate',
  keywords: ['check', 'lint', 'verify'],
  okLabel: 'valid',
  defaults: {},
  options: [],
  run(input) {
    const r = jsonTokens(input);
    return r.ok ? { ok: true, value: input } : r;
  },
};
