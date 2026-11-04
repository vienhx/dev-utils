import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryStorage } from './memory-storage';
import { PREFS_KEY, defaultPrefs, loadPrefs, savePrefs } from './prefs';

let store: MemoryStorage;

beforeEach(() => {
  store = new MemoryStorage();
  vi.stubGlobal('localStorage', store);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('prefs storage', () => {
  it('saves and restores', () => {
    expect(savePrefs({ sidebarCollapsed: true, expandedTools: [] })).toBe(true);
    expect(loadPrefs()).toEqual({ sidebarCollapsed: true, expandedTools: [] });
  });

  const tests: { name: string; raw: string; want: ReturnType<typeof loadPrefs> }[] = [
    { name: 'corrupt JSON', raw: '{oops', want: defaultPrefs() },
    { name: 'not an object', raw: '"x"', want: defaultPrefs() },
    {
      name: 'wrong field types keep defaults',
      raw: '{"sidebarCollapsed":"yes","expandedTools":"chain"}',
      want: defaultPrefs(),
    },
    {
      name: 'non-string tools are dropped',
      raw: '{"sidebarCollapsed":true,"expandedTools":["chain",1,null]}',
      want: { sidebarCollapsed: true, expandedTools: ['chain'] },
    },
  ];
  for (const tt of tests) {
    it(`falls back on ${tt.name}`, () => {
      store.setItem(PREFS_KEY, tt.raw);
      expect(loadPrefs()).toEqual(tt.want);
    });
  }

  it('defaults when storage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(loadPrefs()).toEqual(defaultPrefs());
    expect(savePrefs(defaultPrefs())).toBe(false);
  });
});
