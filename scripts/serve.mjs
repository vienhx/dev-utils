// Serves dist/ with the response headers declared in vercel.json, so tests run against the deployed CSP.
import { createReadStream, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist');
const port = Number(process.env.PORT ?? 4173);

/** @type {{ source: string; headers: { key: string; value: string }[] }[]} */
const rules = JSON.parse(readFileSync('vercel.json', 'utf8')).headers ?? [];

/** Converts a Vercel `source` pattern to a RegExp. Only `(.*)` groups and literal paths are used here. */
function toRegExp(/** @type {string} */ source) {
  const parts = source.split('(.*)').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^${parts.join('(.*)')}$`);
}

const compiled = rules.map((r) => ({ re: toRegExp(r.source), headers: r.headers }));

/** @type {Record<string, string>} */
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  for (const rule of compiled) {
    if (rule.re.test(path)) for (const h of rule.headers) res.setHeader(h.key, h.value);
  }
  const file = normalize(join(root, path.endsWith('/') ? `${path}index.html` : path));
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  try {
    if (!statSync(file).isFile()) throw new Error('not a file');
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => {
  console.log(`serving ${root} on http://127.0.0.1:${port}`);
});
