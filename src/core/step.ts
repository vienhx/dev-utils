import type { Value } from './value';

export type OptionValue = string | number;
export type StepOptions = Record<string, OptionValue>;

export type SelectField = {
  kind: 'select';
  key: string;
  label: string;
  choices: { value: string; label: string }[];
};

export type NumberField = {
  kind: 'number';
  key: string;
  label: string;
  min: number;
  max: number;
};

/** Declarative option, rendered generically by the step card. */
export type OptionField = SelectField | NumberField;

export type StepOutcome = { ok: true; value: Value } | { ok: false; error: string };

export interface StepDef<O extends StepOptions = StepOptions> {
  /** Stable id stored in sessions and templates; never rename. */
  type: string;
  name: string;
  /** Extra picker search terms. */
  keywords: string[];
  /** Status label shown when the step succeeds, e.g. "valid". */
  okLabel?: string;
  defaults: O;
  options: OptionField[];
  run(input: Value, opts: O): StepOutcome;
}

/** One step placed in a chain. */
export type StepInstance = {
  id: string;
  type: string;
  options: StepOptions;
  enabled: boolean;
};

export type StepResult =
  | { status: 'ok'; value: Value }
  | { status: 'error'; error: string }
  | { status: 'skipped' }
  | { status: 'disabled'; value: Value };

export function fieldAccepts(field: OptionField, value: unknown): value is OptionValue {
  if (field.kind === 'select') {
    return typeof value === 'string' && field.choices.some((c) => c.value === value);
  }
  return (
    typeof value === 'number' && Number.isFinite(value) && value >= field.min && value <= field.max
  );
}

/** Merges stored options over a step's defaults, dropping unknown keys and invalid values. */
export function resolveOptions(
  def: StepDef,
  raw: Record<string, unknown> | undefined,
): StepOptions {
  const out: StepOptions = { ...def.defaults };
  for (const field of def.options) {
    const v = raw?.[field.key];
    if (fieldAccepts(field, v)) out[field.key] = v;
  }
  return out;
}

let counter = 0;

/** Unique id for a step instance within this page session. */
export function newStepId(): string {
  counter += 1;
  return `s${Date.now().toString(36)}${counter.toString(36)}`;
}

export function createStep(def: StepDef, options?: Record<string, unknown>): StepInstance {
  return { id: newStepId(), type: def.type, options: resolveOptions(def, options), enabled: true };
}
