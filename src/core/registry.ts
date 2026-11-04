import type { StepDef } from './step';

/** Every step the app knows, in picker order. */
export const steps: StepDef[] = [];

const byType = new Map<string, StepDef>();

export function register(...defs: StepDef[]): void {
  for (const def of defs) {
    if (byType.has(def.type)) throw new Error(`duplicate step type: ${def.type}`);
    byType.set(def.type, def);
    steps.push(def);
  }
}

export function getStep(type: string): StepDef | undefined {
  return byType.get(type);
}
