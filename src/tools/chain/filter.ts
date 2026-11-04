import type { StepDef } from '../../core/step';

/** Steps whose name, type, or keywords contain every typed word (case-insensitive). */
export function filterSteps(defs: readonly StepDef[], query: string): StepDef[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return defs.filter((d) => {
    const hay = [d.name, d.type, ...d.keywords].join(' ').toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

/** Moves an item to a new index in place. Out-of-range moves are ignored. */
export function moveItem<T>(list: T[], from: number, to: number): void {
  if (from === to || from < 0 || from >= list.length || to < 0 || to >= list.length) return;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item as T);
}
