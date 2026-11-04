import { base64Decode } from '../steps/base64/decode';
import { base64Encode } from '../steps/base64/encode';
import { jsonCompact } from '../steps/json/compact';
import { jsonFormat } from '../steps/json/format';
import { jsonValidate } from '../steps/json/validate';
import type { StepDef } from './step';

/** Every step the app knows, in picker order. Adding a step means one file plus one entry here. */
export const steps: readonly StepDef[] = [
  jsonFormat,
  jsonCompact,
  jsonValidate,
  base64Encode,
  base64Decode,
];

const byType = new Map(steps.map((s) => [s.type, s]));

export function getStep(type: string): StepDef | undefined {
  return byType.get(type);
}
