import { isRecord, readJSON, writeJSON } from './local';

export const PREFS_KEY = 'devutils:v1:prefs';

export type Prefs = { sidebarCollapsed: boolean; expandedTools: string[] };

export function defaultPrefs(): Prefs {
  return { sidebarCollapsed: false, expandedTools: ['chain'] };
}

/** Restores UI prefs, falling back to defaults field by field. */
export function loadPrefs(): Prefs {
  const data = readJSON(PREFS_KEY);
  const prefs = defaultPrefs();
  if (!isRecord(data)) return prefs;
  if (typeof data.sidebarCollapsed === 'boolean') prefs.sidebarCollapsed = data.sidebarCollapsed;
  if (Array.isArray(data.expandedTools)) {
    prefs.expandedTools = data.expandedTools.filter((t): t is string => typeof t === 'string');
  }
  return prefs;
}

export function savePrefs(prefs: Prefs): boolean {
  return writeJSON(PREFS_KEY, prefs);
}
