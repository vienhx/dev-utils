<script lang="ts">
  import type { Evaluation } from '../../core/pipeline';
  import { display } from '../../core/value';
  import Icon from '../../shell/Icon.svelte';
  import { icons } from '../../shell/icons';

  let {
    evaluation,
    stepName,
    onCopy,
    onSwap,
  }: {
    evaluation: Evaluation;
    stepName: (index: number) => string;
    onCopy: (text: string) => void;
    onSwap: (text: string) => void;
  } = $props();

  const shown = $derived(evaluation.output.ok ? display(evaluation.output.value) : null);
  const outText = $derived(shown?.kind === 'text' ? shown.text : null);
</script>

<section class="box" aria-labelledby="output-label">
  <div class="bar">
    <h2 id="output-label">Output</h2>
    <span class="spacer"></span>
    <button
      class="btn"
      disabled={outText === null}
      onclick={() => outText !== null && onCopy(outText)}
      data-testid="copy"><Icon d={icons.copy} size={15} /> Copy</button
    >
    <button
      class="btn"
      disabled={outText === null}
      onclick={() => outText !== null && onSwap(outText)}
      title="Move output into input"
      data-testid="swap"><Icon d={icons.swap} size={15} /> Use as input</button
    >
  </div>

  {#if !evaluation.output.ok}
    <div class="error" role="alert" data-testid="output-error">
      <strong
        >Step {evaluation.output.index + 1} · {stepName(evaluation.output.index)} failed</strong
      >
      <span>{evaluation.output.error}</span>
    </div>
  {:else if shown?.kind === 'binary'}
    <div class="binary" data-testid="output-binary">
      <span class="label">binary, {shown.length} {shown.length === 1 ? 'byte' : 'bytes'}</span>
      <pre class="hex">{shown.hex}{shown.truncated ? ' …' : ''}</pre>
      {#if shown.truncated}<p class="note">Showing the first 256 bytes.</p>{/if}
    </div>
  {:else}
    <textarea
      readonly
      value={outText ?? ''}
      aria-labelledby="output-label"
      spellcheck="false"
      data-testid="output"></textarea>
  {/if}
</section>

<style>
  .box {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
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
  .spacer {
    flex: 1;
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
  textarea,
  .binary,
  .error {
    width: 100%;
    min-height: 16rem;
    padding: var(--space-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-2);
    background: var(--surface-2);
  }
  textarea {
    resize: vertical;
    field-sizing: content;
    max-height: 80vh;
    color: var(--text);
    line-height: 1.5;
  }
  .error {
    display: grid;
    align-content: start;
    gap: var(--space-1);
    background: var(--error-soft);
    border-color: transparent;
    color: var(--error);
    overflow-wrap: anywhere;
  }
  .label {
    display: inline-block;
    margin-bottom: var(--space-2);
    padding: 1px var(--space-2);
    border-radius: 999px;
    background: var(--warn-soft);
    color: var(--warn);
    font-size: var(--text-xs);
    font-weight: 600;
  }
  .hex {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    color: var(--text-muted);
  }
  .note {
    margin: var(--space-2) 0 0;
    color: var(--text-muted);
    font-size: var(--text-xs);
  }
</style>
