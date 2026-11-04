export type Route = { tool: string; params: Record<string, string> };

export type ParsedRoute = Route & {
  /** True when the URL should be replaced with the canonical `#/<tool>` route. */
  redirect: boolean;
};

/** Parses `#/<tool>?a=b`. Empty or unknown tools fall back to `fallback` and ask for a redirect. */
export function parseHash(hash: string, known: readonly string[], fallback: string): ParsedRoute {
  const body = hash.replace(/^#/, '');
  const q = body.indexOf('?');
  const path = (q < 0 ? body : body.slice(0, q)).replace(/^\/+|\/+$/g, '');
  const params: Record<string, string> = {};
  if (q >= 0) {
    for (const [k, v] of new URLSearchParams(body.slice(q + 1))) params[k] = v;
  }
  if (!known.includes(path)) return { tool: fallback, params: {}, redirect: true };
  return { tool: path, params, redirect: false };
}

export function toolHash(tool: string, params: Record<string, string> = {}): string {
  const qs = new URLSearchParams(params).toString();
  return `#/${tool}${qs ? `?${qs}` : ''}`;
}
