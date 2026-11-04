import type { Component } from 'svelte';

export type ToolDef = {
  id: string;
  name: string;
  /** SVG path data drawn in a 24x24 stroke icon. */
  icon: string;
  /** Whether the tool has templates nested under it in the sidebar. */
  templates: boolean;
  load: () => Promise<{ default: Component }>;
};

/** Every tool in the app. The sidebar, router, and default route are driven from this list. */
export const tools: readonly ToolDef[] = [
  {
    id: 'chain',
    name: 'Chain',
    icon: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
    templates: true,
    load: () => import('../tools/chain/Chain.svelte'),
  },
];

export const defaultTool = 'chain';

export const toolIds = tools.map((t) => t.id);

export function getTool(id: string): ToolDef | undefined {
  return tools.find((t) => t.id === id);
}
