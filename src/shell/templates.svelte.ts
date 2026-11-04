import type { StepInstance } from '../core/step';
import {
  deleteTemplate,
  listTemplates,
  renameTemplate,
  saveTemplate,
  type RenameResult,
  type SaveResult,
  type TemplateEntry,
  TEMPLATES_KEY,
} from '../storage/templates';

let version = $state(0);

function bump() {
  version += 1;
}

// Keep the sidebar in step with edits made in other tabs.
if (typeof window !== 'undefined') {
  addEventListener('storage', (e) => {
    if (e.key === null || e.key === TEMPLATES_KEY) bump();
  });
}

/** Reactive facade over template storage: reads re-run after any change. */
export const templates = {
  list(tool: string): TemplateEntry[] {
    void version;
    return listTemplates(tool);
  },
  save(tool: string, name: string, steps: StepInstance[], overwrite = false): SaveResult {
    const r = saveTemplate(tool, name, steps, { overwrite });
    if (r.ok) bump();
    return r;
  },
  rename(id: string, name: string): RenameResult {
    const r = renameTemplate(id, name);
    if (r.ok) bump();
    return r;
  },
  remove(id: string): boolean {
    const ok = deleteTemplate(id);
    bump();
    return ok;
  },
};
