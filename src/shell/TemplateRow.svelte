<script lang="ts">
  import type { TemplateEntry } from '../storage/templates';
  import { askConfirm, askText } from './dialog-state.svelte';
  import Icon from './Icon.svelte';
  import { icons } from './icons';
  import { toolHash } from './router';
  import { templates } from './templates.svelte';
  import { showToast } from './toast-state.svelte';

  let { template, onNavigate }: { template: TemplateEntry; onNavigate?: () => void } = $props();

  let menu: HTMLElement | undefined = $state();
  let trigger: HTMLButtonElement | undefined = $state();
  const menuId = $derived(`tpl-menu-${template.id}`);

  const renameErrors = {
    blank: 'Enter a name.',
    exists: 'That name is already in use.',
    missing: 'This template no longer exists.',
    storage: "Couldn't save: browser storage is full or blocked.",
  } as const;

  function place(e: ToggleEvent) {
    if (e.newState !== 'open' || !menu || !trigger) return;
    const r = trigger.getBoundingClientRect();
    const width = menu.offsetWidth;
    menu.style.top = `${Math.round(r.bottom + 4)}px`;
    menu.style.left = `${Math.round(Math.max(8, Math.min(r.right - width, innerWidth - width - 8)))}px`;
    menu.querySelector('button')?.focus();
  }

  async function rename() {
    menu?.hidePopover();
    await askText({
      title: 'Rename template',
      label: 'Name',
      initial: template.name,
      submitLabel: 'Rename',
      validate: (v) => {
        const r = templates.rename(template.id, v);
        return r.ok ? null : renameErrors[r.reason];
      },
    });
  }

  async function remove() {
    menu?.hidePopover();
    const ok = await askConfirm({
      title: 'Delete template',
      message: `Delete "${template.name}"? This can't be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok && !templates.remove(template.id)) {
      showToast("Couldn't delete: browser storage is blocked.", { tone: 'error' });
    }
  }
</script>

<li class="row" data-testid="template-row">
  {#if template.available}
    <a class="link" href={toolHash(template.tool, { template: template.id })} onclick={onNavigate}
      >{template.name}</a
    >
  {:else}
    <span class="link unavailable" title="Uses steps this version doesn't support"
      >{template.name} <small>unavailable</small></span
    >
  {/if}
  <button
    bind:this={trigger}
    class="more"
    popovertarget={menuId}
    aria-label={`Actions for ${template.name}`}
    aria-haspopup="true"><Icon d={icons.more} size={16} /></button
  >
  <div bind:this={menu} id={menuId} popover="auto" class="menu" ontoggle={place}>
    <button onclick={rename}>Rename</button>
    <button class="danger" onclick={remove}>Delete</button>
  </div>
</li>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    min-width: 0;
    border-radius: var(--radius-1);
  }
  .row:hover,
  .row:focus-within {
    background: var(--surface-2);
  }
  .link {
    flex: 1;
    min-width: 0;
    padding: var(--space-1) var(--space-2);
    color: var(--text-muted);
    text-decoration: none;
    font-size: var(--text-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-radius: var(--radius-1);
  }
  a.link:hover {
    color: var(--text);
  }
  .unavailable {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .unavailable small {
    font-size: var(--text-xs);
  }
  .more {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border: 0;
    border-radius: var(--radius-1);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    opacity: 0;
  }
  .row:hover .more,
  .row:focus-within .more,
  .more:focus-visible {
    opacity: 1;
  }
  @media (hover: none) {
    .more {
      opacity: 1;
    }
  }
  .more:hover {
    background: var(--border);
    color: var(--text);
  }
  .menu {
    position: fixed;
    inset: auto;
    margin: 0;
    min-width: 140px;
    padding: var(--space-1);
    border: 1px solid var(--border);
    border-radius: var(--radius-1);
    background: var(--surface);
    color: var(--text);
    box-shadow: var(--shadow);
  }
  .menu:popover-open {
    display: grid;
  }
  .menu button {
    padding: var(--space-2) var(--space-3);
    border: 0;
    border-radius: var(--radius-1);
    background: transparent;
    text-align: left;
    cursor: pointer;
  }
  .menu button:hover,
  .menu button:focus-visible {
    background: var(--surface-2);
  }
  .menu .danger {
    color: var(--error);
  }
</style>
