import { getStep } from '../core/registry';
import { newStepId, resolveOptions, type StepInstance, type StepOptions } from '../core/step';
import { isRecord, readJSON, writeJSON } from './local';

export const TEMPLATES_KEY = 'devutils:v1:templates';

export type TemplateStep = { type: string; options: StepOptions; enabled: boolean };

export type Template = {
  id: string;
  tool: string;
  name: string;
  savedAt: number;
  steps: TemplateStep[];
};

/** A stored template plus whether every step it uses is known to this app version. */
export type TemplateEntry = Template & { available: boolean };

export type SaveResult =
  | { ok: true; template: Template }
  | { ok: false; reason: 'blank' | 'storage' }
  | { ok: false; reason: 'exists'; existing: Template };

export type RenameResult =
  { ok: true } | { ok: false; reason: 'blank' | 'exists' | 'missing' | 'storage' };

/** Name comparison key: trimmed and case-insensitive. */
export function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

function parseStep(v: unknown): TemplateStep | null {
  if (!isRecord(v) || typeof v.type !== 'string' || !isRecord(v.options)) return null;
  if (typeof v.enabled !== 'boolean') return null;
  return { type: v.type, options: v.options as StepOptions, enabled: v.enabled };
}

function parseTemplate(v: unknown): Template | null {
  if (!isRecord(v)) return null;
  const { id, tool, name, savedAt, steps } = v;
  if (typeof id !== 'string' || typeof tool !== 'string' || typeof name !== 'string') return null;
  if (typeof savedAt !== 'number' || !Array.isArray(steps)) return null;
  const parsed = steps.map(parseStep);
  if (parsed.some((s) => s === null)) return null;
  return { id, tool, name, savedAt, steps: parsed as TemplateStep[] };
}

/** Raw stored list. Unreadable items are kept so writes never destroy them. */
function readRaw(): unknown[] {
  const data = readJSON(TEMPLATES_KEY);
  return Array.isArray(data) ? data : [];
}

function readAll(): { raw: unknown[]; templates: (Template | null)[] } {
  const raw = readRaw();
  return { raw, templates: raw.map(parseTemplate) };
}

function toEntry(t: Template): TemplateEntry {
  return { ...t, available: t.steps.every((s) => getStep(s.type) !== undefined) };
}

/** Readable templates of one tool, newest first. */
export function listTemplates(tool: string): TemplateEntry[] {
  return readAll()
    .templates.filter((t): t is Template => t !== null && t.tool === tool)
    .sort((a, b) => b.savedAt - a.savedAt)
    .map(toEntry);
}

export function getTemplate(id: string): TemplateEntry | undefined {
  const t = readAll().templates.find((t) => t?.id === id);
  return t ? toEntry(t) : undefined;
}

function findIndexByName(
  templates: (Template | null)[],
  tool: string,
  name: string,
  exceptId?: string,
) {
  const key = nameKey(name);
  return templates.findIndex(
    (t) => t !== null && t.tool === tool && t.id !== exceptId && nameKey(t.name) === key,
  );
}

function newTemplateId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `t${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
  );
}

/**
 * Saves the chain as a template of `tool`. An existing name is reported as `exists` unless
 * `overwrite` is set, in which case that template keeps its id and name and gets the new steps.
 */
export function saveTemplate(
  tool: string,
  name: string,
  steps: StepInstance[],
  opts: { overwrite?: boolean; now?: number } = {},
): SaveResult {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, reason: 'blank' };

  const { raw, templates } = readAll();
  const stored: TemplateStep[] = structuredClone(
    steps.map(({ type, options, enabled }) => ({ type, options, enabled })),
  );
  const savedAt = opts.now ?? Date.now();
  const idx = findIndexByName(templates, tool, trimmed);
  let template: Template;

  if (idx >= 0) {
    const existing = templates[idx] as Template;
    if (!opts.overwrite) return { ok: false, reason: 'exists', existing };
    template = { ...existing, savedAt, steps: stored };
    raw[idx] = template;
  } else {
    template = { id: newTemplateId(), tool, name: trimmed, savedAt, steps: stored };
    raw.push(template);
  }

  return writeJSON(TEMPLATES_KEY, raw) ? { ok: true, template } : { ok: false, reason: 'storage' };
}

export function renameTemplate(id: string, name: string): RenameResult {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, reason: 'blank' };
  const { raw, templates } = readAll();
  const idx = templates.findIndex((t) => t?.id === id);
  const current = templates[idx];
  if (idx < 0 || !current) return { ok: false, reason: 'missing' };
  if (findIndexByName(templates, current.tool, trimmed, id) >= 0)
    return { ok: false, reason: 'exists' };
  raw[idx] = { ...current, name: trimmed };
  return writeJSON(TEMPLATES_KEY, raw) ? { ok: true } : { ok: false, reason: 'storage' };
}

export function deleteTemplate(id: string): boolean {
  const { raw, templates } = readAll();
  const idx = templates.findIndex((t) => t?.id === id);
  if (idx < 0) return true;
  raw.splice(idx, 1);
  return writeJSON(TEMPLATES_KEY, raw);
}

/** Fresh chain steps from a template: deep-copied with new ids. Returns null if any step is unknown. */
export function instantiate(template: Template): StepInstance[] | null {
  const out: StepInstance[] = [];
  for (const s of template.steps) {
    const def = getStep(s.type);
    if (!def) return null;
    out.push({
      id: newStepId(),
      type: s.type,
      options: resolveOptions(def, structuredClone(s.options)),
      enabled: s.enabled,
    });
  }
  return out;
}
