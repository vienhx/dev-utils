import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getStep } from '../core/registry';
import { createStep, type StepInstance } from '../core/step';
import { MemoryStorage } from './memory-storage';
import {
  TEMPLATES_KEY,
  deleteTemplate,
  getTemplate,
  instantiate,
  listTemplates,
  renameTemplate,
  saveTemplate,
} from './templates';

let store: MemoryStorage;

beforeEach(() => {
  store = new MemoryStorage();
  vi.stubGlobal('localStorage', store);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function chain(...types: string[]): StepInstance[] {
  return types.map((t) => createStep(getStep(t)!));
}

const b64ToJson = () => {
  const steps = chain('base64.decode', 'json.format');
  steps[1]!.options = { indent: '4' };
  return steps;
};

function save(name: string, steps = chain('json.format'), now = 1) {
  const r = saveTemplate('chain', name, steps, { now });
  if (!r.ok) throw new Error(r.reason);
  return r.template;
}

describe('saving templates', () => {
  it('stores ordered steps with options and enabled state, without input', () => {
    const steps = b64ToJson();
    steps[0]!.enabled = false;
    save('B64 to JSON', steps);
    const [t] = listTemplates('chain');
    expect(t).toMatchObject({
      tool: 'chain',
      name: 'B64 to JSON',
      available: true,
      steps: [
        { type: 'base64.decode', options: {}, enabled: false },
        { type: 'json.format', options: { indent: '4' }, enabled: true },
      ],
    });
    expect(JSON.stringify(t)).not.toContain('input');
  });

  const blanks = ['', '   ', '\t\n'];
  for (const name of blanks) {
    it(`rejects blank name ${JSON.stringify(name)}`, () => {
      expect(saveTemplate('chain', name, chain('json.format'))).toEqual({
        ok: false,
        reason: 'blank',
      });
      expect(listTemplates('chain')).toEqual([]);
    });
  }

  it('trims the saved name', () => {
    expect(save('  Pretty  ').name).toBe('Pretty');
  });

  it('reports an existing name ignoring case and whitespace', () => {
    const first = save('Pretty');
    const r = saveTemplate('chain', ' pretty ', chain('json.compact'));
    expect(r).toEqual({ ok: false, reason: 'exists', existing: first });
    expect(listTemplates('chain')[0]?.steps[0]?.type).toBe('json.format');
  });

  it('overwrites an existing name when confirmed, keeping one template', () => {
    const first = save('Pretty', chain('json.format'), 1);
    const r = saveTemplate('chain', 'pretty', chain('json.compact'), { overwrite: true, now: 2 });
    expect(r.ok).toBe(true);
    const list = listTemplates('chain');
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: first.id, name: 'Pretty', savedAt: 2 });
    expect(list[0]?.steps.map((s) => s.type)).toEqual(['json.compact']);
  });

  it('checks name uniqueness per tool', () => {
    save('Same');
    expect(saveTemplate('other', 'same', chain('json.format')).ok).toBe(true);
    expect(listTemplates('chain')).toHaveLength(1);
    expect(listTemplates('other')).toHaveLength(1);
  });

  it('reports a storage error and leaves storage unchanged', () => {
    save('Kept');
    store.failWrites = true;
    expect(saveTemplate('chain', 'New', chain('json.format'))).toEqual({
      ok: false,
      reason: 'storage',
    });
    store.failWrites = false;
    expect(listTemplates('chain').map((t) => t.name)).toEqual(['Kept']);
  });

  it('is not changed by later edits to the chain', () => {
    const steps = b64ToJson();
    save('B64 to JSON', steps);
    steps[1]!.options.indent = '2';
    steps.pop();
    expect(listTemplates('chain')[0]?.steps).toHaveLength(2);
    expect(listTemplates('chain')[0]?.steps[1]?.options).toEqual({ indent: '4' });
  });
});

describe('listing templates', () => {
  it('lists newest first', () => {
    save('A', undefined, 1);
    save('B', undefined, 2);
    expect(listTemplates('chain').map((t) => t.name)).toEqual(['B', 'A']);
  });

  it('persists across reads (reload)', () => {
    save('Kept');
    expect(JSON.parse(store.getItem(TEMPLATES_KEY)!)).toHaveLength(1);
    expect(listTemplates('chain').map((t) => t.name)).toEqual(['Kept']);
  });

  it('marks templates with unknown steps unavailable and keeps others working', () => {
    save('Good');
    const raw = JSON.parse(store.getItem(TEMPLATES_KEY)!);
    raw.push({
      id: 'x',
      tool: 'chain',
      name: 'Future',
      savedAt: 5,
      steps: [{ type: 'gzip.compress', options: {}, enabled: true }],
    });
    store.setItem(TEMPLATES_KEY, JSON.stringify(raw));
    const list = listTemplates('chain');
    expect(list.map((t) => [t.name, t.available])).toEqual([
      ['Future', false],
      ['Good', true],
    ]);
    expect(instantiate(list[0]!)).toBeNull();
    expect(instantiate(list[1]!)).toHaveLength(1);
  });

  it('ignores unreadable entries and keeps them on write', () => {
    store.setItem(TEMPLATES_KEY, JSON.stringify([42, { id: 'bad' }, null]));
    expect(listTemplates('chain')).toEqual([]);
    save('Good');
    const raw = JSON.parse(store.getItem(TEMPLATES_KEY)!);
    expect(raw).toHaveLength(4);
    expect(listTemplates('chain').map((t) => t.name)).toEqual(['Good']);
  });

  const corrupt = ['{nope', '"str"', '{}'];
  for (const raw of corrupt) {
    it(`treats corrupt key ${raw} as empty`, () => {
      store.setItem(TEMPLATES_KEY, raw);
      expect(listTemplates('chain')).toEqual([]);
    });
  }
});

describe('renaming templates', () => {
  it('renames', () => {
    const t = save('B64 to JSON');
    expect(renameTemplate(t.id, 'Decode JSON')).toEqual({ ok: true });
    expect(listTemplates('chain').map((x) => x.name)).toEqual(['Decode JSON']);
  });

  it('allows changing only the case of its own name', () => {
    const t = save('pretty');
    expect(renameTemplate(t.id, 'Pretty')).toEqual({ ok: true });
  });

  const rejects: { name: string; to: string; reason: string }[] = [
    { name: 'existing name', to: ' OTHER ', reason: 'exists' },
    { name: 'blank name', to: '  ', reason: 'blank' },
  ];
  for (const tt of rejects) {
    it(`rejects ${tt.name}`, () => {
      const t = save('Mine', undefined, 1);
      save('Other', undefined, 2);
      expect(renameTemplate(t.id, tt.to)).toEqual({ ok: false, reason: tt.reason });
      expect(getTemplate(t.id)?.name).toBe('Mine');
    });
  }

  it('reports a missing template', () => {
    expect(renameTemplate('nope', 'x')).toEqual({ ok: false, reason: 'missing' });
  });
});

describe('deleting templates', () => {
  it('removes the template permanently', () => {
    const t = save('Decode JSON');
    expect(deleteTemplate(t.id)).toBe(true);
    expect(listTemplates('chain')).toEqual([]);
    expect(getTemplate(t.id)).toBeUndefined();
  });
});

describe('instantiating templates', () => {
  it('deep-copies steps with new ids', () => {
    const t = save('B64 to JSON', b64ToJson());
    const a = instantiate(t)!;
    const b = instantiate(t)!;
    expect(a.map((s) => s.type)).toEqual(['base64.decode', 'json.format']);
    expect(a[1]?.options).toEqual({ indent: '4' });
    expect(a[0]?.id).not.toBe(b[0]?.id);
    a[1]!.options.indent = '2';
    expect(t.steps[1]?.options).toEqual({ indent: '4' });
    expect(getTemplate(t.id)?.steps[1]?.options).toEqual({ indent: '4' });
  });
});
