import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { scanDist } from './check-dist.mjs';

function dist(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'check-dist-'));
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, content);
  }
  return dir;
}

const page = (head: string) => `<!doctype html><html><head>${head}</head><body></body></html>`;

describe('scanDist', () => {
  it('fails on the third-party script fixture', () => {
    expect(scanDist('scripts/fixtures/third-party-dist')).toEqual([
      'index.html: third-party URL https://cdn.example.com/widget.js',
    ]);
  });

  const tests: { name: string; files: Record<string, string>; want: string[] }[] = [
    {
      name: 'clean build',
      files: {
        'index.html': page(
          '<script type="module" src="/assets/a.js"></script><link rel="stylesheet" href="/assets/a.css">',
        ),
        'assets/a.js':
          'const ns="http://www.w3.org/2000/svg";throw Error("https://svelte.dev/e/effect_orphan")',
        'assets/a.css': 'body{font-family:x}',
      },
      want: [],
    },
    {
      name: 'inline script',
      files: { 'index.html': page('<script>alert(1)</script>') },
      want: ['index.html: inline <script>'],
    },
    {
      name: 'inline style element',
      files: { 'index.html': page('<style>body{}</style>') },
      want: ['index.html: inline <style>'],
    },
    {
      name: 'inline style attribute',
      files: { 'index.html': '<div style="color:red"></div>' },
      want: ['index.html: inline style attribute'],
    },
    {
      name: 'fetch to another origin in JS',
      files: { 'assets/a.js': 'fetch("https://api.example.com/collect")' },
      want: ['assets/a.js: third-party URL https://api.example.com/collect'],
    },
    {
      name: 'CDN font in CSS',
      files: { 'assets/a.css': '@import url(https://fonts.googleapis.com/css2?family=Inter);' },
      want: ['assets/a.css: third-party URL https://fonts.googleapis.com/css2?family=Inter'],
    },
    {
      name: 'source repository link',
      files: { 'assets/a.js': 'const repo="https://github.com/vienhx/dev-utils"' },
      want: [],
    },
    {
      name: 'other GitHub URL',
      files: { 'assets/a.js': 'import("https://github.com/vienhx/dev-utils/raw/x.js")' },
      want: ['assets/a.js: third-party URL https://github.com/vienhx/dev-utils/raw/x.js'],
    },
    {
      name: 'tracker name',
      files: { 'assets/a.js': 'window.posthog.capture("x")' },
      want: ['assets/a.js: tracker reference "posthog"'],
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(scanDist(dist(tt.files))).toEqual(tt.want);
    });
  }
});
