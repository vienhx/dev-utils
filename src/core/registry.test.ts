import { describe, expect, it } from 'vitest';
import { getStep, steps } from './registry';
import { fieldAccepts } from './step';

describe('step registry', () => {
  it('contains the built-in steps in picker order', () => {
    expect(steps.map((s) => s.type)).toEqual([
      'json.format',
      'json.compact',
      'json.validate',
      'json.escape',
      'json.unescape',
      'base64.encode',
      'base64.decode',
      'lines.dedupe',
      'lines.quote',
      'lines.join',
      'text.wrap',
    ]);
  });

  it('has unique types and names', () => {
    expect(new Set(steps.map((s) => s.type)).size).toBe(steps.length);
    expect(new Set(steps.map((s) => s.name)).size).toBe(steps.length);
  });

  for (const def of steps) {
    describe(def.type, () => {
      it('is found by type', () => {
        expect(getStep(def.type)).toBe(def);
      });

      it('has defaults that satisfy its option fields', () => {
        expect(Object.keys(def.defaults).sort()).toEqual(def.options.map((f) => f.key).sort());
        for (const field of def.options) {
          expect(fieldAccepts(field, def.defaults[field.key])).toBe(true);
        }
      });

      it('has lowercase keywords', () => {
        for (const k of def.keywords) expect(k).toBe(k.toLowerCase());
      });
    });
  }

  it('includes the documented picker keywords', () => {
    const all = (type: string) => getStep(type)?.keywords ?? [];
    expect(all('base64.decode')).toContain('b64');
    expect(all('base64.encode')).toContain('b64');
    expect(all('json.format')).toContain('pretty');
    expect(all('json.compact')).toContain('minify');
    expect(all('json.escape')).toEqual(['stringify', 'quote', 'string']);
    expect(all('json.unescape')).toEqual(['unquote', 'unstringify', 'string']);
    expect(all('lines.dedupe')).toEqual(['unique', 'distinct', 'duplicate']);
    expect(all('lines.quote')).toEqual(['wrap', 'string', 'escape']);
    expect(all('lines.join')).toEqual(['compact', 'one line', 'separator', 'csv', 'implode']);
    expect(all('text.wrap')).toEqual(['array', 'brackets', 'list', 'in']);
  });

  it('returns undefined for unknown types', () => {
    expect(getStep('nope')).toBeUndefined();
  });
});
