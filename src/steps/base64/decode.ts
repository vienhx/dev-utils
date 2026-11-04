import type { StepDef } from '../../core/step';
import { asText, bytes } from '../../core/value';
import { decodeBase64 } from './codec';

export const base64Decode: StepDef<Record<string, never>> = {
  type: 'base64.decode',
  name: 'Base64 decode',
  keywords: ['b64', 'atob', 'decode'],
  defaults: {},
  options: [],
  run(input) {
    const t = asText(input);
    if (!t.ok) return t;
    const r = decodeBase64(t.text);
    return r.ok ? { ok: true, value: bytes(r.bytes) } : r;
  },
};
