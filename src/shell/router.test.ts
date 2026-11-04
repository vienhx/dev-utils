import { describe, expect, it } from 'vitest';
import { parseHash, toolHash, type ParsedRoute } from './router';

const known = ['chain', 'other'];

describe('parseHash', () => {
  const tests: { name: string; hash: string; want: ParsedRoute }[] = [
    { name: 'no hash', hash: '', want: { tool: 'chain', params: {}, redirect: true } },
    { name: 'bare #', hash: '#', want: { tool: 'chain', params: {}, redirect: true } },
    { name: 'root', hash: '#/', want: { tool: 'chain', params: {}, redirect: true } },
    { name: 'known tool', hash: '#/chain', want: { tool: 'chain', params: {}, redirect: false } },
    {
      name: 'other known tool',
      hash: '#/other',
      want: { tool: 'other', params: {}, redirect: false },
    },
    {
      name: 'trailing slash',
      hash: '#/chain/',
      want: { tool: 'chain', params: {}, redirect: false },
    },
    {
      name: 'unknown tool',
      hash: '#/does-not-exist',
      want: { tool: 'chain', params: {}, redirect: true },
    },
    {
      name: 'case sensitive',
      hash: '#/Chain',
      want: { tool: 'chain', params: {}, redirect: true },
    },
    {
      name: 'query params',
      hash: '#/chain?template=abc-123',
      want: { tool: 'chain', params: { template: 'abc-123' }, redirect: false },
    },
    {
      name: 'encoded params',
      hash: '#/chain?template=a%20b&x=1',
      want: { tool: 'chain', params: { template: 'a b', x: '1' }, redirect: false },
    },
    {
      name: 'unknown tool drops params',
      hash: '#/nope?template=abc',
      want: { tool: 'chain', params: {}, redirect: true },
    },
    {
      name: 'without leading slash',
      hash: '#chain',
      want: { tool: 'chain', params: {}, redirect: false },
    },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      expect(parseHash(tt.hash, known, 'chain')).toEqual(tt.want);
    });
  }
});

describe('toolHash', () => {
  it('builds plain and parameterised routes', () => {
    expect(toolHash('chain')).toBe('#/chain');
    expect(toolHash('chain', { template: 'a b' })).toBe('#/chain?template=a+b');
  });

  it('round-trips through parseHash', () => {
    const hash = toolHash('chain', { template: 'x/y&z' });
    expect(parseHash(hash, known, 'chain').params).toEqual({ template: 'x/y&z' });
  });
});
