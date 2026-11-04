import type { StepDef } from '../../core/step';
import { asBytes, text } from '../../core/value';
import { encodeBase64 } from './codec';

export const base64Encode: StepDef<{ variant: 'standard' | 'url' }> = {
  type: 'base64.encode',
  name: 'Base64 encode',
  keywords: ['b64', 'btoa', 'encode'],
  defaults: { variant: 'standard' },
  options: [
    {
      kind: 'select',
      key: 'variant',
      label: 'Variant',
      choices: [
        { value: 'standard', label: 'Standard' },
        { value: 'url', label: 'URL-safe' },
      ],
    },
  ],
  run(input, opts) {
    return { ok: true, value: text(encodeBase64(asBytes(input), opts.variant === 'url')) };
  },
};
