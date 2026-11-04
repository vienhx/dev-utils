import { getStep } from '../core/registry';
import { newStepId, resolveOptions, type StepInstance } from '../core/step';
import { isRecord, readJSON, writeJSON } from './local';

export const SESSION_KEY = 'devutils:v1:session';
export const SESSION_SAVE_DELAY = 300;

export type Session = { input: string; steps: StepInstance[] };

export function emptySession(): Session {
  return { input: '', steps: [] };
}

/** Restores the saved session. Corrupt data gives an empty session; unknown or malformed steps are dropped. */
export function loadSession(): Session {
  const data = readJSON(SESSION_KEY);
  if (!isRecord(data) || typeof data.input !== 'string' || !Array.isArray(data.steps)) {
    return emptySession();
  }
  const steps: StepInstance[] = [];
  for (const raw of data.steps) {
    if (!isRecord(raw) || typeof raw.type !== 'string') continue;
    const def = getStep(raw.type);
    if (!def) continue;
    steps.push({
      id: newStepId(),
      type: def.type,
      options: resolveOptions(def, isRecord(raw.options) ? raw.options : undefined),
      enabled: raw.enabled !== false,
    });
  }
  return { input: data.input, steps };
}

export function saveSession(session: Session): boolean {
  return writeJSON(SESSION_KEY, {
    input: session.input,
    steps: session.steps.map(({ type, options, enabled }) => ({ type, options, enabled })),
  });
}

/** Returns a saver that writes the latest session once changes pause for `delay` ms. */
export function createSessionSaver(delay = SESSION_SAVE_DELAY) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: Session | undefined;

  const flush = () => {
    clearTimeout(timer);
    timer = undefined;
    if (pending) saveSession(pending);
    pending = undefined;
  };

  return {
    save(session: Session) {
      pending = session;
      clearTimeout(timer);
      timer = setTimeout(flush, delay);
    },
    flush,
  };
}
