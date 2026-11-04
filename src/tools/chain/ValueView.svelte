<script lang="ts">
  import { display, type Value } from '../../core/value';

  let { value }: { value: Value } = $props();
  const shown = $derived(display(value));
</script>

{#if shown.kind === 'text'}
  <pre class="peek-text" data-testid="peek-text">{shown.text}</pre>
{:else}
  <div class="binary" data-testid="binary">
    <span class="label">binary, {shown.length} {shown.length === 1 ? 'byte' : 'bytes'}</span>
    <pre class="hex">{shown.hex}{shown.truncated ? ' …' : ''}</pre>
  </div>
{/if}

<style>
  pre {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
  }
  .label {
    display: inline-block;
    margin-bottom: var(--space-1);
    padding: 1px var(--space-2);
    border-radius: 999px;
    background: var(--warn-soft);
    color: var(--warn);
    font-size: var(--text-xs);
    font-weight: 600;
  }
  .hex {
    color: var(--text-muted);
  }
</style>
