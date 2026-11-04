<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { evaluate } from '../../core/pipeline';
  import { getStep } from '../../core/registry';
  import { createStep, type StepDef, type StepInstance } from '../../core/step';
  import { text } from '../../core/value';
  import { askConfirm, askText } from '../../shell/dialog-state.svelte';
  import Icon from '../../shell/Icon.svelte';
  import { icons } from '../../shell/icons';
  import { replaceRoute, route } from '../../shell/route.svelte';
  import { templates } from '../../shell/templates.svelte';
  import { showToast } from '../../shell/toast-state.svelte';
  import { createSessionSaver, loadSession } from '../../storage/session';
  import { getTemplate, instantiate } from '../../storage/templates';
  import { moveItem } from './filter';
  import OutputBox from './OutputBox.svelte';
  import Picker from './Picker.svelte';
  import StepCard from './StepCard.svelte';

  const TOOL = 'chain';
  const INPUT_DEBOUNCE = 150;
  const UNDO_MS = 6000;

  const restored = loadSession();
  let input = $state(restored.input);
  let steps: StepInstance[] = $state(restored.steps);

  // Typing is debounced; chain and option edits recompute immediately.
  let evalInput = $state(restored.input);
  $effect(() => {
    const v = input;
    if (v === untrack(() => evalInput)) return;
    const t = setTimeout(() => (evalInput = v), INPUT_DEBOUNCE);
    return () => clearTimeout(t);
  });

  const evaluation = $derived(evaluate(text(evalInput), steps));

  const saver = createSessionSaver();
  $effect(() => {
    saver.save({ input, steps: $state.snapshot(steps) });
  });
  addEventListener('pagehide', saver.flush);
  onDestroy(() => {
    removeEventListener('pagehide', saver.flush);
    saver.flush();
  });

  let picker: Picker | undefined = $state();

  function onWindowKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      picker?.open();
    }
  }

  function addStep(def: StepDef) {
    steps.push(createStep(def));
  }

  function removeStep(index: number) {
    steps.splice(index, 1);
  }

  // Drag and drop reordering.
  let dragFrom: number | null = $state(null);
  let dropAt: { index: number; side: 'before' | 'after' } | null = $state(null);

  function onDragOver(e: DragEvent, index: number) {
    if (dragFrom === null) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dropAt = { index, side: e.clientY < r.top + r.height / 2 ? 'before' : 'after' };
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    if (dragFrom !== null && dropAt) {
      let to = dropAt.side === 'before' ? dropAt.index : dropAt.index + 1;
      if (dragFrom < to) to -= 1;
      moveItem(steps, dragFrom, to);
    }
    dragFrom = null;
    dropAt = null;
  }

  function stepName(index: number): string {
    const s = steps[index];
    return s ? (getStep(s.type)?.name ?? s.type) : '';
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      showToast('Copied', { duration: 1500 });
    } catch {
      showToast("Couldn't copy to the clipboard", { tone: 'error' });
    }
  }

  function swap(value: string) {
    input = value;
    evalInput = value;
  }

  async function saveAsTemplate() {
    const name = await askText({
      title: 'Save as template',
      label: 'Template name',
      submitLabel: 'Save',
      validate: (v) => (v.trim() ? null : 'Enter a name.'),
    });
    if (name === null) return;
    const snapshot = $state.snapshot(steps);
    let r = templates.save(TOOL, name, snapshot);
    if (!r.ok && r.reason === 'exists') {
      const replace = await askConfirm({
        title: 'Replace template?',
        message: `A template named "${r.existing.name}" already exists. Replace it with the current chain?`,
        confirmLabel: 'Replace',
      });
      if (!replace) return;
      r = templates.save(TOOL, name, snapshot, true);
    }
    if (r.ok) showToast(`Saved "${r.template.name}"`);
    else
      showToast("Couldn't save the template: browser storage is full or blocked.", {
        tone: 'error',
      });
  }

  function loadTemplate(id: string) {
    const t = getTemplate(id);
    if (!t || t.tool !== TOOL) {
      showToast('Template not found', { tone: 'error' });
      return;
    }
    const loaded = instantiate(t);
    if (!loaded) {
      showToast(`"${t.name}" uses steps this version doesn't support, so it can't be loaded.`, {
        tone: 'error',
      });
      return;
    }
    const previous = $state.snapshot(steps);
    steps = loaded;
    showToast(`Loaded "${t.name}"`, {
      duration: UNDO_MS,
      action: { label: 'Undo', run: () => (steps = previous) },
    });
  }

  // `#/chain?template=<id>` loads once, then the URL is cleaned so a reload doesn't load again.
  $effect(() => {
    const id = route.tool === TOOL ? route.params.template : undefined;
    if (!id) return;
    untrack(() => loadTemplate(id));
    replaceRoute(TOOL);
  });
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="workspace">
  <div class="toolbar">
    <h1>Chain</h1>
    <span class="count"
      >{steps.length}
      {steps.length === 1 ? 'step' : 'steps'}</span
    >
    <span class="spacer"></span>
    <button
      class="btn"
      disabled={steps.length === 0}
      title={steps.length === 0 ? 'Add a step first' : undefined}
      onclick={saveAsTemplate}
      data-testid="save-template"><Icon d={icons.save} size={15} /> Save as template</button
    >
  </div>

  <div class="grid" data-testid="grid">
    <section class="col" aria-labelledby="input-label">
      <div class="bar"><h2 id="input-label">Input</h2></div>
      <textarea
        bind:value={input}
        aria-labelledby="input-label"
        placeholder="Paste or type text…"
        spellcheck="false"
        data-testid="input"></textarea>
    </section>

    <section class="col chain" aria-labelledby="chain-label">
      <div class="bar">
        <h2 id="chain-label">Steps</h2>
        <span class="spacer"></span>
        <kbd class="hint" title="Open the step picker">Ctrl/⌘ K</kbd>
      </div>
      <!-- Drop zone for native drag and drop; keyboard and touch use the move buttons. -->
      <ol class="steps" ondrop={onDrop} ondragover={(e) => dragFrom !== null && e.preventDefault()}>
        {#each steps as step, i (step.id)}
          <li ondragover={(e) => onDragOver(e, i)}>
            <StepCard
              {step}
              def={getStep(step.type)}
              result={evaluation.results[i]}
              index={i}
              count={steps.length}
              dropSide={dropAt?.index === i ? dropAt.side : null}
              onMove={(to) => moveItem(steps, i, to)}
              onRemove={() => removeStep(i)}
              onDragStart={() => (dragFrom = i)}
              onDragEnd={() => {
                dragFrom = null;
                dropAt = null;
              }}
            />
          </li>
        {:else}
          <li class="empty">No steps yet. The output equals the input.</li>
        {/each}
      </ol>
      <button class="add" onclick={() => picker?.open()} data-testid="add-step">
        <Icon d={icons.plus} size={16} /> Add step
      </button>
    </section>

    <div class="col">
      <OutputBox {evaluation} {stepName} onCopy={copy} onSwap={swap} />
    </div>
  </div>
</div>

<Picker bind:this={picker} onPick={addStep} />

<style>
  .workspace {
    container-type: inline-size;
    padding: var(--space-4);
  }
  .toolbar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
    margin-bottom: var(--space-4);
  }
  h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 650;
  }
  .count {
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
  .spacer {
    flex: 1;
  }
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-5);
    align-items: start;
  }
  @container (min-width: 1024px) {
    .grid {
      grid-template-columns: minmax(0, 1fr) minmax(300px, 0.9fr) minmax(0, 1fr);
      gap: var(--space-4);
    }
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 32px;
  }
  h2 {
    margin: 0;
    font-size: var(--text-sm);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
  }
  textarea {
    width: 100%;
    min-height: 16rem;
    max-height: 80vh;
    padding: var(--space-3);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-2);
    background: var(--surface);
    color: var(--text);
    line-height: 1.5;
    resize: vertical;
    field-sizing: content;
  }
  textarea:focus-visible {
    border-color: var(--accent);
  }
  .steps {
    display: grid;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .empty {
    padding: var(--space-5) var(--space-4);
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-2);
    color: var(--text-muted);
    text-align: center;
    font-size: var(--text-sm);
  }
  .add {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-2);
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-2);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font-weight: 500;
  }
  .add:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-soft);
  }
  .hint {
    padding: 1px 6px;
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-muted);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-1);
    background: var(--surface);
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .btn:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
  }
  .btn:disabled {
    opacity: 0.45;
    cursor: default;
  }
</style>
