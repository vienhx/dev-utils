import { loadPrefs, savePrefs, type Prefs } from '../storage/prefs';

export const prefs: Prefs = $state(loadPrefs());

function persist() {
  savePrefs($state.snapshot(prefs));
}

export function toggleSidebar(): void {
  prefs.sidebarCollapsed = !prefs.sidebarCollapsed;
  persist();
}

export function isExpanded(tool: string): boolean {
  return prefs.expandedTools.includes(tool);
}

export function toggleExpanded(tool: string): void {
  prefs.expandedTools = isExpanded(tool)
    ? prefs.expandedTools.filter((t) => t !== tool)
    : [...prefs.expandedTools, tool];
  persist();
}
