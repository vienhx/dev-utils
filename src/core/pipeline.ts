import { getStep } from './registry';
import {
  resolveOptions,
  type StepDef,
  type StepInstance,
  type StepOutcome,
  type StepResult,
} from './step';
import type { Value } from './value';

export type Evaluation = {
  results: StepResult[];
  /** Final value, or the first error with the index of the step that failed. */
  output: { ok: true; value: Value } | { ok: false; error: string; index: number };
};

type Lookup = (type: string) => StepDef | undefined;

function runStep(def: StepDef, step: StepInstance, input: Value): StepOutcome {
  try {
    return def.run(input, resolveOptions(def, step.options));
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Runs the input through each step in order. Disabled steps pass through; after an error, the rest are skipped. */
export function evaluate(
  input: Value,
  chain: StepInstance[],
  lookup: Lookup = getStep,
): Evaluation {
  const results: StepResult[] = [];
  let current = input;

  for (const [index, step] of chain.entries()) {
    if (!step.enabled) {
      results.push({ status: 'disabled', value: current });
      continue;
    }
    const def = lookup(step.type);
    const outcome: StepOutcome = def
      ? runStep(def, step, current)
      : { ok: false, error: `unknown step "${step.type}"` };
    if (!outcome.ok) {
      results.push({ status: 'error', error: outcome.error });
      while (results.length < chain.length) results.push({ status: 'skipped' });
      return { results, output: { ok: false, error: outcome.error, index } };
    }
    current = outcome.value;
    results.push({ status: 'ok', value: current });
  }

  return { results, output: { ok: true, value: current } };
}
