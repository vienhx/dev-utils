// Fails if the build contains inline scripts or styles, third-party URLs, or tracker code.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const TEXT = new Set(['.html', '.js', '.mjs', '.css', '.svg', '.json', '.txt', '.webmanifest']);

// Absolute URLs that are inert strings, never fetched: XML namespaces and Svelte error-doc links.
const ALLOWED_URLS = [
  /^http:\/\/www\.w3\.org\/(1999\/xhtml|2000\/svg|1998\/Math\/MathML|1999\/xlink|XML\/1998\/namespace)$/,
  /^https:\/\/svelte\.dev\/e\/[a-z_]+$/,
];

const TRACKERS =
  /\b(gtag|google-analytics|googletagmanager|analytics|sentry|segment\.(io|com)|mixpanel|posthog|vercel\/insights|vercel\/speed-insights|hotjar|plausible|amplitude)\b/i;

/**
 * @param {string} dir
 * @returns {Generator<string>}
 */
function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

/**
 * Scans a build directory and returns a list of problems.
 * @param {string} dir
 * @returns {string[]}
 */
export function scanDist(dir) {
  /** @type {string[]} */
  const problems = [];
  for (const path of walk(dir)) {
    const ext = extname(path);
    if (!TEXT.has(ext)) continue;
    const rel = relative(dir, path);
    const src = readFileSync(path, 'utf8');

    if (ext === '.html') {
      for (const m of src.matchAll(/<script\b([^>]*)>/gi)) {
        if (!/\bsrc\s*=/.test(m[1] ?? '')) problems.push(`${rel}: inline <script>`);
      }
      if (/<style\b/i.test(src)) problems.push(`${rel}: inline <style>`);
      if (/\sstyle\s*=/i.test(src)) problems.push(`${rel}: inline style attribute`);
      if (/\son[a-z]+\s*=/i.test(src)) problems.push(`${rel}: inline event handler`);
    }

    for (const m of src.matchAll(
      /(?:https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}(?:[/?#][^\s"'`()<>\\]*)?/gi,
    )) {
      const url = m[0];
      if (!/^https?:/i.test(url)) {
        // Protocol-relative `//host` in HTML/CSS loads from another origin.
        if (ext === '.html' || ext === '.css') problems.push(`${rel}: third-party URL ${url}`);
        continue;
      }
      if (!ALLOWED_URLS.some((re) => re.test(url))) problems.push(`${rel}: third-party URL ${url}`);
    }

    const tracker = src.match(TRACKERS);
    if (tracker) problems.push(`${rel}: tracker reference "${tracker[0]}"`);
  }
  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2] ?? 'dist';
  const problems = scanDist(dir);
  if (problems.length) {
    console.error(`check:dist found ${problems.length} problem(s) in ${dir}:`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`check:dist: ${dir} is clean`);
}
