import { describe, expect, it } from 'vitest';
import { steps } from '../../core/registry';
import { filterSteps, moveItem } from './filter';

describe('filterSteps', () => {
  const tests: { query: string; want: string[] }[] = [
    { query: '', want: steps.map((s) => s.name) },
    { query: 'b64 dec', want: ['Base64 decode'] },
    { query: 'B64', want: ['Base64 encode', 'Base64 decode'] },
    { query: 'pretty', want: ['JSON format'] },
    { query: 'minify', want: ['JSON compact'] },
    { query: 'json', want: ['JSON format', 'JSON compact', 'JSON validate'] },
    { query: '  json   valid ', want: ['JSON validate'] },
    { query: 'xml', want: [] },
  ];
  for (const tt of tests) {
    it(JSON.stringify(tt.query), () => {
      expect(filterSteps(steps, tt.query).map((s) => s.name)).toEqual(tt.want);
    });
  }
});

describe('moveItem', () => {
  const tests: { name: string; from: number; to: number; want: string[] }[] = [
    { name: 'down', from: 0, to: 1, want: ['b', 'a', 'c'] },
    { name: 'up', from: 2, to: 0, want: ['c', 'a', 'b'] },
    { name: 'same index', from: 1, to: 1, want: ['a', 'b', 'c'] },
    { name: 'past the end', from: 2, to: 3, want: ['a', 'b', 'c'] },
    { name: 'before the start', from: 0, to: -1, want: ['a', 'b', 'c'] },
  ];
  for (const tt of tests) {
    it(tt.name, () => {
      const list = ['a', 'b', 'c'];
      moveItem(list, tt.from, tt.to);
      expect(list).toEqual(tt.want);
    });
  }
});
