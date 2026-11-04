import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createStep } from '../core/step';
import { getStep } from '../core/registry';
import { MemoryStorage } from './memory-storage';
import { SESSION_KEY, createSessionSaver, emptySession, loadSession, saveSession } from './session';

let store: MemoryStorage;

beforeEach(() => {
  store = new MemoryStorage();
  vi.stubGlobal('localStorage', store);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const format = getStep('json.format')!;
const compact = getStep('json.compact')!;

describe('session storage', () => {
  it('saves and restores input, steps, options, and enabled state', () => {
    const a = createStep(format, { indent: '4' });
    const b = { ...createStep(compact), enabled: false };
    expect(saveSession({ input: '{"a":1}', steps: [a, b] })).toBe(true);

    const restored = loadSession();
    expect(restored.input).toBe('{"a":1}');
    expect(
      restored.steps.map(({ type, options, enabled }) => ({ type, options, enabled })),
    ).toEqual([
      { type: 'json.format', options: { indent: '4' }, enabled: true },
      { type: 'json.compact', options: {}, enabled: false },
    ]);
    expect(restored.steps.every((s) => typeof s.id === 'string' && s.id)).toBe(true);
  });

  const links: { name: string; stored: unknown; want: string | undefined }[] = [
    { name: 'a string id', stored: 'abc-123', want: 'abc-123' },
    { name: 'a missing id', stored: undefined, want: undefined },
    { name: 'a non-string id', stored: 42, want: undefined },
  ];
  for (const tt of links) {
    it(`restores the template link for ${tt.name}`, () => {
      store.setItem(SESSION_KEY, JSON.stringify({ input: '', steps: [], templateId: tt.stored }));
      expect(loadSession().templateId).toBe(tt.want);
    });
  }

  it('round-trips the template link', () => {
    expect(saveSession({ input: '', steps: [], templateId: 'abc-123' })).toBe(true);
    expect(loadSession().templateId).toBe('abc-123');
  });

  const fallbacks: { name: string; raw: string | null }[] = [
    { name: 'nothing saved', raw: null },
    { name: 'corrupt JSON', raw: '{not json' },
    { name: 'wrong shape', raw: '{"input":1,"steps":"x"}' },
    { name: 'array', raw: '[]' },
  ];
  for (const tt of fallbacks) {
    it(`falls back to empty on ${tt.name}`, () => {
      if (tt.raw !== null) store.setItem(SESSION_KEY, tt.raw);
      expect(loadSession()).toEqual(emptySession());
    });
  }

  it('drops unknown and malformed steps but keeps the rest', () => {
    store.setItem(
      SESSION_KEY,
      JSON.stringify({
        input: 'x',
        steps: [
          { type: 'gone.step', options: {}, enabled: true },
          5,
          { type: 'json.format', options: { indent: 'bad' } },
        ],
      }),
    );
    const s = loadSession();
    expect(s.steps).toHaveLength(1);
    expect(s.steps[0]).toMatchObject({
      type: 'json.format',
      options: { indent: '2' },
      enabled: true,
    });
  });

  it('survives a throwing localStorage', () => {
    vi.stubGlobal('localStorage', {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
    });
    expect(loadSession()).toEqual(emptySession());
    expect(saveSession({ input: 'a', steps: [] })).toBe(false);
  });

  it('survives localStorage access itself throwing', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('denied', 'SecurityError');
      },
    });
    try {
      expect(loadSession()).toEqual(emptySession());
      expect(saveSession({ input: 'a', steps: [] })).toBe(false);
    } finally {
      Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });

  it('debounces saves and writes only the latest session', () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(store, 'setItem');
    const saver = createSessionSaver(300);
    saver.save({ input: 'a', steps: [] });
    vi.advanceTimersByTime(200);
    saver.save({ input: 'ab', steps: [] });
    vi.advanceTimersByTime(299);
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(loadSession().input).toBe('ab');
  });

  it('flush writes immediately', () => {
    vi.useFakeTimers();
    const saver = createSessionSaver(300);
    saver.save({ input: 'now', steps: [] });
    saver.flush();
    expect(loadSession().input).toBe('now');
  });
});
