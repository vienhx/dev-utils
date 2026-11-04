<script lang="ts">
  import { steps } from '../../core/registry';
  import type { StepDef } from '../../core/step';
  import Icon from '../../shell/Icon.svelte';
  import { icons } from '../../shell/icons';
  import { filterSteps } from './filter';

  let { onPick }: { onPick: (def: StepDef) => void } = $props();

  let el: HTMLDialogElement | undefined = $state();
  let input: HTMLInputElement | undefined = $state();
  let query = $state('');
  let active = $state(0);

  const results = $derived(filterSteps(steps, query));
  const activeId = $derived.by(() => {
    const def = results[active];
    return def ? `picker-${def.type}` : undefined;
  });

  $effect(() => {
    void query;
    active = 0;
  });

  export function open() {
    if (!el || el.open) return;
    query = '';
    el.showModal();
    input?.focus();
  }

  function pick(def: StepDef | undefined) {
    if (!def) return;
    onPick(def);
    el?.close();
  }

  function onkeydown(e: KeyboardEvent) {
    const n = results.length;
    if (e.key === 'ArrowDown' && n) {
      e.preventDefault();
      active = (active + 1) % n;
    } else if (e.key === 'ArrowUp' && n) {
      e.preventDefault();
      active = (active - 1 + n) % n;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(results[active]);
    }
  }

  function onclick(e: MouseEvent) {
    if (e.target === el) el?.close();
  }
</script>

<dialog bind:this={el} class="picker" aria-label="Add step" {onclick} data-testid="picker">
  <div class="search">
    <Icon d={icons.search} size={18} />
    <input
      bind:this={input}
      bind:value={query}
      {onkeydown}
      type="text"
      role="combobox"
      aria-expanded="true"
      aria-controls="picker-list"
      aria-activedescendant={activeId}
      aria-autocomplete="list"
      placeholder="Search steps…"
      autocomplete="off"
      spellcheck="false"
      data-testid="picker-input"
    />
    <kbd>Esc</kbd>
  </div>
  <ul id="picker-list" role="listbox" aria-label="Steps">
    {#each results as def, i (def.type)}
      <li
        id={`picker-${def.type}`}
        role="option"
        aria-selected={i === active}
        class:active={i === active}
        onpointermove={() => (active = i)}
        onclick={() => pick(def)}
        onkeydown={() => {}}
      >
        <span class="name">{def.name}</span>
        {#if def.keywords.length}<span class="kw">{def.keywords.join(', ')}</span>{/if}
      </li>
    {:else}
      <li class="empty" role="presentation">No matching steps</li>
    {/each}
  </ul>
</dialog>

<style>
  .picker {
    width: min(520px, calc(100vw - 32px));
    margin-top: 12vh;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius-2);
    background: var(--surface);
    color: var(--text);
    box-shadow: var(--shadow);
  }
  .picker::backdrop {
    background: rgb(0 0 0 / 35%);
  }
  .search {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border);
    color: var(--text-muted);
  }
  input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    color: var(--text);
    font-size: var(--text-lg);
    outline: none;
  }
  input:focus-visible {
    box-shadow: none;
  }
  kbd {
    padding: 1px 6px;
    border: 1px solid var(--border);
    border-radius: 4px;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: var(--space-2);
    max-height: 50vh;
    overflow-y: auto;
  }
  li {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-1);
    cursor: pointer;
  }
  li.active {
    background: var(--accent-soft);
  }
  .name {
    font-weight: 500;
  }
  .kw {
    color: var(--text-muted);
    font-size: var(--text-xs);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .empty {
    color: var(--text-muted);
    cursor: default;
  }
</style>
