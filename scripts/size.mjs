// Bundle budget: gzip size of the initial JS+CSS and of each lazily loaded chunk, read from the Vite manifest.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

/**
 * @typedef {{ file: string; css?: string[]; imports?: string[]; dynamicImports?: string[]; isEntry?: boolean; isDynamicEntry?: boolean }} Chunk
 */

/** Gzip size in bytes of a built file. */
function gzipSize(/** @type {string} */ dir, /** @type {string} */ file) {
  return gzipSync(readFileSync(join(dir, file)), { level: 9 }).length;
}

/** JS and CSS files of a chunk plus everything it imports statically. */
function closure(
  /** @type {Record<string, Chunk>} */ manifest,
  /** @type {string} */ key,
  seen = new Set(),
) {
  /** @type {Set<string>} */
  const files = new Set();
  if (seen.has(key)) return files;
  seen.add(key);
  const chunk = manifest[key];
  if (!chunk) return files;
  files.add(chunk.file);
  for (const css of chunk.css ?? []) files.add(css);
  for (const imp of chunk.imports ?? []) for (const f of closure(manifest, imp, seen)) files.add(f);
  return files;
}

/**
 * Measures the build against the budgets (in KB of gzip).
 * @param {string} dir
 * @param {{ initialKb: number; lazyKb: number }} budgets
 */
export function measure(dir, budgets) {
  /** @type {Record<string, Chunk>} */
  const manifest = JSON.parse(readFileSync(join(dir, '.vite/manifest.json'), 'utf8'));
  const entries = Object.keys(manifest).filter((k) => manifest[k]?.isEntry);
  /** @type {Set<string>} */
  const initial = new Set();
  for (const e of entries) for (const f of closure(manifest, e)) initial.add(f);

  const sum = (/** @type {Iterable<string>} */ files) =>
    [...files].reduce((n, f) => n + gzipSize(dir, f), 0);

  const rows = [
    { name: 'initial (entry + static imports)', bytes: sum(initial), limit: budgets.initialKb },
  ];
  for (const key of Object.keys(manifest).filter((k) => manifest[k]?.isDynamicEntry)) {
    const own = [...closure(manifest, key)].filter((f) => !initial.has(f));
    rows.push({ name: `lazy ${key}`, bytes: sum(own), limit: budgets.lazyKb });
  }
  return rows.map((r) => ({ ...r, ok: r.bytes <= r.limit * 1024 }));
}

function flag(/** @type {string} */ name, /** @type {number} */ fallback) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? Number(arg.split('=')[1]) : fallback;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = measure('dist', { initialKb: flag('initial', 60), lazyKb: flag('lazy', 30) });
  for (const r of rows) {
    const kb = (r.bytes / 1024).toFixed(1);
    console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${kb.padStart(6)} KB / ${r.limit} KB  ${r.name}`);
  }
  if (rows.some((r) => !r.ok)) {
    console.error('Bundle budget exceeded.');
    process.exit(1);
  }
}
