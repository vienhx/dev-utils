/** Returns localStorage, or null when the browser blocks or lacks it. */
function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Reads and parses a JSON key. Missing, unreadable, or corrupt data returns undefined. */
export function readJSON(key: string): unknown {
  try {
    const raw = storage()?.getItem(key);
    return raw == null ? undefined : (JSON.parse(raw) as unknown);
  } catch {
    return undefined;
  }
}

/** Writes a JSON key. Returns false when storage is unavailable or full. */
export function writeJSON(key: string, value: unknown): boolean {
  try {
    const s = storage();
    if (!s) return false;
    s.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
