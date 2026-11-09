<script lang="ts">
  import Icon from './Icon.svelte';
  import { icons } from './icons';
  import { isExpanded, toggleExpanded, toggleSidebar } from './prefs.svelte';
  import { route } from './route.svelte';
  import { toolHash } from './router';
  import TemplateRow from './TemplateRow.svelte';
  import { templates } from './templates.svelte';
  import { tools } from './tools';

  let {
    mode,
    onNavigate,
  }: {
    /** full: desktop sidebar; rail: collapsed desktop icons; drawer: mobile overlay. */
    mode: 'full' | 'rail' | 'drawer';
    onNavigate?: () => void;
  } = $props();

  let flyout: string | null = $state(null);
  let closeTimer: ReturnType<typeof setTimeout> | undefined;

  function openFlyout(id: string) {
    clearTimeout(closeTimer);
    flyout = id;
  }

  function closeFlyoutSoon() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => (flyout = null), 120);
  }

  function onRailFocusOut(e: FocusEvent) {
    const item = e.currentTarget as HTMLElement;
    if (!item.contains(e.relatedTarget as Node | null)) flyout = null;
  }

  function onRailKeydown(e: KeyboardEvent) {
    if (e.key !== 'Escape' || flyout === null) return;
    const item = e.currentTarget as HTMLElement;
    flyout = null;
    item.querySelector<HTMLElement>('.rail-link')?.focus();
  }
</script>

<nav class="sidebar" class:rail={mode === 'rail'} aria-label="Tools" data-testid="sidebar">
  <div class="brand">
    <span class="logo"><Icon d={icons.logo} size={18} /></span>
    {#if mode !== 'rail'}<span class="name">dev-utils</span>{/if}
    {#if mode !== 'drawer'}
      <button
        class="collapse"
        aria-label={mode === 'rail' ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={mode !== 'rail'}
        onclick={toggleSidebar}
        data-testid="collapse"
      >
        <Icon d={mode === 'rail' ? icons.chevronRight : icons.chevronLeft} size={16} />
      </button>
    {/if}
  </div>

  <ul class="tools">
    {#each tools as tool (tool.id)}
      {@const active = route.tool === tool.id}
      {@const list = tool.templates ? templates.list(tool.id) : []}
      {#if mode === 'rail'}
        <!-- Hover, focus, and Escape on the item drive the flyout; its links stay the interactive elements. -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <li
          class="rail-item"
          onpointerenter={() => openFlyout(tool.id)}
          onpointerleave={closeFlyoutSoon}
          onfocusin={() => openFlyout(tool.id)}
          onfocusout={onRailFocusOut}
          onkeydown={onRailKeydown}
        >
          <a
            class="rail-link"
            class:active
            href={toolHash(tool.id)}
            aria-label={tool.name}
            aria-current={active ? 'page' : undefined}
            onclick={onNavigate}
          >
            <Icon d={tool.icon} size={20} />
          </a>
          {#if tool.templates}
            <div
              class="flyout"
              hidden={flyout !== tool.id}
              role="group"
              aria-label={`${tool.name} templates`}
              data-testid="flyout"
            >
              <div class="flyout-title">{tool.name}</div>
              <ul class="templates">
                {#each list as t (t.id)}
                  <li>
                    {#if t.available}
                      <a class="flyout-link" href={toolHash(tool.id, { template: t.id })}
                        >{t.name}</a
                      >
                    {:else}
                      <span class="flyout-link unavailable">{t.name}</span>
                    {/if}
                  </li>
                {:else}
                  <li class="hint">Saved chains appear here.</li>
                {/each}
              </ul>
            </div>
          {/if}
        </li>
      {:else}
        {@const expanded = isExpanded(tool.id)}
        <li class="tool">
          <div class="tool-row" class:active>
            <a
              class="tool-link"
              href={toolHash(tool.id)}
              aria-current={active ? 'page' : undefined}
              onclick={onNavigate}
            >
              <Icon d={tool.icon} size={18} />
              <span>{tool.name}</span>
            </a>
            {#if tool.templates}
              <button
                class="section-toggle"
                aria-expanded={expanded}
                aria-controls={`templates-${mode}-${tool.id}`}
                aria-label={`${tool.name} templates`}
                onclick={() => toggleExpanded(tool.id)}
                data-testid="section-toggle"
              >
                <span class="chev" class:open={expanded}
                  ><Icon d={icons.chevronDown} size={16} /></span
                >
              </button>
            {/if}
          </div>
          {#if tool.templates}
            <ul
              class="templates"
              id={`templates-${mode}-${tool.id}`}
              hidden={!expanded}
              aria-label={`${tool.name} templates`}
            >
              {#each list as t (t.id)}
                <TemplateRow template={t} {onNavigate} />
              {:else}
                <li class="hint">Saved chains appear here.</li>
              {/each}
            </ul>
          {/if}
        </li>
      {/if}
    {/each}
  </ul>

  <div class="foot">
    <a
      class="repo"
      href="https://github.com/vienhx/dev-utils"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={mode === 'rail' ? 'GitHub repository' : undefined}
      title={mode === 'rail' ? 'GitHub repository' : undefined}
      data-testid="repo-link"
    >
      <Icon d={icons.github} size={mode === 'rail' ? 20 : 18} />
      {#if mode !== 'rail'}<span>GitHub</span>{/if}
    </a>
  </div>
</nav>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: var(--space-3);
    gap: var(--space-3);
    background: var(--surface);
    overflow-y: auto;
  }
  .sidebar.rail {
    padding: var(--space-3) var(--space-2);
    align-items: center;
    overflow: visible;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 32px;
    padding: 0 var(--space-1);
    font-weight: 650;
  }
  .rail .brand {
    flex-direction: column;
    padding: 0;
  }
  .logo {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: var(--accent);
    color: var(--accent-text);
  }
  .name {
    flex: 1;
  }
  .collapse,
  .section-toggle {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: var(--radius-1);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
  }
  .collapse:hover,
  .section-toggle:hover {
    background: var(--surface-2);
    color: var(--text);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .tools {
    display: grid;
    gap: var(--space-1);
  }
  .tool-row {
    display: flex;
    align-items: center;
    border-radius: var(--radius-1);
  }
  .tool-row:hover {
    background: var(--surface-2);
  }
  .tool-row.active {
    background: var(--accent-soft);
  }
  .tool-link {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    color: var(--text);
    text-decoration: none;
    font-weight: 500;
    border-radius: var(--radius-1);
  }
  .tool-row.active .tool-link {
    color: var(--accent);
    font-weight: 600;
  }
  .chev {
    display: grid;
    transform: rotate(-90deg);
    transition: transform 0.12s;
  }
  .chev.open {
    transform: none;
  }
  .templates {
    display: grid;
    gap: 1px;
    margin: var(--space-1) 0 var(--space-2) var(--space-5);
  }
  .templates[hidden] {
    display: none;
  }
  .hint {
    padding: var(--space-1) var(--space-2);
    color: var(--text-muted);
    font-size: var(--text-xs);
  }

  /* Rail */
  .rail-item {
    position: relative;
  }
  .rail-link {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-1);
    color: var(--text-muted);
  }
  .rail-link:hover {
    background: var(--surface-2);
    color: var(--text);
  }
  .rail-link.active {
    background: var(--accent-soft);
    color: var(--accent);
  }
  .flyout {
    position: absolute;
    top: 0;
    left: calc(100% + var(--space-2));
    z-index: 30;
    width: 220px;
    padding: var(--space-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-2);
    background: var(--surface);
    box-shadow: var(--shadow);
  }
  .flyout[hidden] {
    display: none;
  }
  /* Bridge the gap so the pointer can move from icon to flyout. */
  .flyout::before {
    content: '';
    position: absolute;
    inset: 0 100% 0 calc(-1 * var(--space-2));
  }
  .flyout-title {
    padding: var(--space-1) var(--space-2);
    font-weight: 600;
    font-size: var(--text-sm);
  }
  .flyout .templates {
    margin: 0;
  }
  .flyout-link {
    display: block;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-1);
    color: var(--text-muted);
    text-decoration: none;
    font-size: var(--text-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  a.flyout-link:hover,
  a.flyout-link:focus-visible {
    background: var(--surface-2);
    color: var(--text);
  }
  .flyout-link.unavailable {
    opacity: 0.6;
  }

  /* Source link, pinned to the bottom */
  .foot {
    margin-top: auto;
    align-self: stretch;
    display: flex;
    justify-content: center;
    padding-top: var(--space-2);
    border-top: 1px solid var(--border);
  }
  .repo {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    border-radius: var(--radius-1);
    color: var(--text-muted);
    text-decoration: none;
    font-size: var(--text-sm);
  }
  .repo:hover {
    background: var(--surface-2);
    color: var(--text);
  }
  .rail .repo {
    flex: none;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
  }
</style>
