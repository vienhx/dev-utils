<script lang="ts">
  import type { StepDef, StepInstance, StepResult } from '../../core/step';
  import Icon from '../../shell/Icon.svelte';
  import { icons } from '../../shell/icons';
  import ValueView from './ValueView.svelte';

  let {
    step,
    def,
    result,
    index,
    count,
    dropSide,
    onMove,
    onRemove,
    onDragStart,
    onDragEnd,
  }: {
    step: StepInstance;
    def: StepDef | undefined;
    result: StepResult | undefined;
    index: number;
    count: number;
    dropSide: 'before' | 'after' | null;
    onMove: (to: number) => void;
    onRemove: () => void;
    onDragStart: () => void;
    onDragEnd: () => void;
  } = $props();

  let peek = $state(false);
  let card: HTMLElement | undefined = $state();

  const status = $derived(result?.status ?? 'skipped');
  const badge = $derived(status === 'ok' ? (def?.okLabel ?? 'ok') : status);
  const name = $derived(def?.name ?? step.type);
  const peekValue = $derived(
    result && (result.status === 'ok' || result.status === 'disabled') ? result.value : null,
  );

  function dragStart(e: DragEvent) {
    if (!e.dataTransfer) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', step.id);
    if (card) e.dataTransfer.setDragImage(card, 16, 16);
    onDragStart();
  }

  function setNumber(key: string, e: Event) {
    const n = (e.currentTarget as HTMLInputElement).valueAsNumber;
    if (Number.isFinite(n)) step.options[key] = n;
  }
</script>

<article
  bind:this={card}
  class="card"
  class:off={!step.enabled}
  class:drop-before={dropSide === 'before'}
  class:drop-after={dropSide === 'after'}
  aria-label={`Step ${index + 1}: ${name}`}
  data-testid="step"
  data-status={status}
>
  <header class="head">
    <span
      class="grip"
      draggable="true"
      ondragstart={dragStart}
      ondragend={onDragEnd}
      title="Drag to reorder"
      aria-hidden="true"><Icon d={icons.grip} size={16} /></span
    >
    <span class="num">{index + 1}</span>
    <h3 class="name">{name}</h3>
    <span class="badge {status}" data-testid="status">{badge}</span>
  </header>

  {#if def && def.options.length > 0}
    <div class="options">
      {#each def.options as field (field.key)}
        <label class="option">
          <span>{field.label}</span>
          {#if field.kind === 'select'}
            <select bind:value={step.options[field.key]}>
              {#each field.choices as c (c.value)}
                <option value={c.value}>{c.label}</option>
              {/each}
            </select>
          {:else if field.kind === 'text'}
            <input
              type="text"
              class="mono"
              maxlength={field.maxLength}
              spellcheck="false"
              autocomplete="off"
              bind:value={step.options[field.key]}
            />
          {:else}
            <input
              type="number"
              min={field.min}
              max={field.max}
              value={step.options[field.key]}
              oninput={(e) => setNumber(field.key, e)}
            />
          {/if}
        </label>
      {/each}
    </div>
  {/if}

  {#if result?.status === 'error'}
    <p class="error" role="alert" data-testid="step-error">{result.error}</p>
  {/if}

  {#if peek}
    <div class="peek" data-testid="peek">
      {#if peekValue}
        <ValueView value={peekValue} />
      {:else}
        <span class="muted"
          >No output: this step {status === 'error' ? 'failed' : 'was skipped'}.</span
        >
      {/if}
    </div>
  {/if}

  <footer class="tools">
    <label class="switch">
      <input type="checkbox" bind:checked={step.enabled} />
      <span>Enabled</span>
    </label>
    <span class="spacer"></span>
    <button
      class="icon-btn"
      aria-expanded={peek}
      aria-label={`Peek output of ${name}`}
      title="Peek output"
      onclick={() => (peek = !peek)}
      data-testid="peek-toggle"><Icon d={icons.eye} size={16} /></button
    >
    <button
      class="icon-btn"
      aria-label={`Move ${name} up`}
      title="Move up"
      disabled={index === 0}
      onclick={() => onMove(index - 1)}
      data-testid="move-up"><Icon d={icons.up} size={16} /></button
    >
    <button
      class="icon-btn"
      aria-label={`Move ${name} down`}
      title="Move down"
      disabled={index === count - 1}
      onclick={() => onMove(index + 1)}
      data-testid="move-down"><Icon d={icons.down} size={16} /></button
    >
    <button
      class="icon-btn danger"
      aria-label={`Remove ${name}`}
      title="Remove"
      onclick={onRemove}
      data-testid="remove"><Icon d={icons.x} size={16} /></button
    >
  </footer>
</article>

<style>
  .card {
    position: relative;
    display: grid;
    gap: var(--space-2);
    padding: var(--space-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-2);
    background: var(--surface);
  }
  .card.off {
    background: var(--surface-2);
  }
  .card.off .name {
    color: var(--text-muted);
    text-decoration: line-through;
  }
  .drop-before::before,
  .drop-after::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 3px;
    border-radius: 2px;
    background: var(--accent);
  }
  .drop-before::before {
    top: -7px;
  }
  .drop-after::after {
    bottom: -7px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }
  .grip {
    color: var(--text-muted);
    cursor: grab;
    padding: 2px;
    border-radius: 4px;
  }
  @media (pointer: coarse) {
    .grip {
      display: none;
    }
  }
  .num {
    display: grid;
    place-items: center;
    min-width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--surface-2);
    color: var(--text-muted);
    font-size: var(--text-xs);
    font-weight: 600;
  }
  .name {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: var(--text-md);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .badge {
    padding: 1px var(--space-2);
    border-radius: 999px;
    font-size: var(--text-xs);
    font-weight: 600;
  }
  .badge.ok {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .badge.error {
    background: var(--error-soft);
    color: var(--error);
  }
  .badge.skipped,
  .badge.disabled {
    background: var(--surface-2);
    color: var(--text-muted);
  }
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
  .option {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  select,
  input[type='number'],
  input[type='text'] {
    padding: 2px var(--space-2);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-1);
    background: var(--bg);
    color: var(--text);
  }
  input[type='number'] {
    width: 6em;
  }
  input[type='text'] {
    width: 8em;
  }
  .error {
    margin: 0;
    padding: var(--space-2);
    border-radius: var(--radius-1);
    background: var(--error-soft);
    color: var(--error);
    font-size: var(--text-sm);
    overflow-wrap: anywhere;
  }
  .peek {
    max-height: 220px;
    overflow: auto;
    padding: var(--space-2);
    border-radius: var(--radius-1);
    background: var(--bg);
    border: 1px dashed var(--border-strong);
  }
  .muted {
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
  .tools {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
  .spacer {
    flex: 1;
  }
  .switch {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-sm);
    color: var(--text-muted);
    cursor: pointer;
  }
  .switch input {
    accent-color: var(--accent);
  }
  .icon-btn {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: var(--radius-1);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
  }
  .icon-btn:hover:not(:disabled) {
    background: var(--surface-2);
    color: var(--text);
  }
  .icon-btn[aria-expanded='true'] {
    background: var(--accent-soft);
    color: var(--accent);
  }
  .icon-btn.danger:hover {
    color: var(--error);
  }
  .icon-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }
</style>
