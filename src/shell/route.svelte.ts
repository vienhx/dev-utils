import { parseHash, toolHash, type Route } from './router';
import { defaultTool, toolIds } from './tools';

/** Current hash route, kept in sync with the URL. */
export const route: Route = $state({ tool: defaultTool, params: {} });

function sync() {
  const parsed = parseHash(location.hash, toolIds, defaultTool);
  if (parsed.redirect) history.replaceState(history.state, '', toolHash(parsed.tool));
  route.tool = parsed.tool;
  route.params = parsed.params;
}

export function startRouter(): () => void {
  sync();
  addEventListener('hashchange', sync);
  return () => removeEventListener('hashchange', sync);
}

/** Replaces the URL without a new history entry or a reload. */
export function replaceRoute(tool: string, params: Record<string, string> = {}): void {
  history.replaceState(history.state, '', toolHash(tool, params));
  sync();
}
