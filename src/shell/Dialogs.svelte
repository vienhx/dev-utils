<script lang="ts">
  import { dialogs } from './dialog-state.svelte';

  let el: HTMLDialogElement | undefined = $state();
  let value = $state('');
  let error = $state('');
  let settled = false;

  const req = $derived(dialogs.current);

  $effect(() => {
    if (!req || !el) return;
    settled = false;
    error = '';
    value = req.kind === 'prompt' ? req.initial : '';
    if (!el.open) el.showModal();
  });

  function finish(result: string | boolean | null) {
    const r = req;
    if (!r || settled) return;
    settled = true;
    if (r.kind === 'prompt') r.resolve(typeof result === 'string' ? result : null);
    else r.resolve(result === true);
    dialogs.current = null;
    el?.close();
  }

  function onsubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!req) return;
    if (req.kind === 'prompt') {
      const msg = req.validate(value);
      if (msg) {
        error = msg;
        return;
      }
      finish(value);
    } else {
      finish(true);
    }
  }
</script>

<dialog
  bind:this={el}
  class="dialog"
  aria-labelledby="dialog-title"
  onclose={() => {
    // A close queued by the previous request can arrive after the next one reopened the dialog.
    if (!el?.open) finish(null);
  }}
  data-testid="dialog"
>
  {#if req}
    <form method="dialog" {onsubmit}>
      <h2 id="dialog-title">{req.title}</h2>
      {#if req.kind === 'prompt'}
        <label class="field">
          <span>{req.label}</span>
          <!-- svelte-ignore a11y_autofocus -->
          <input
            type="text"
            bind:value
            autofocus
            autocomplete="off"
            spellcheck="false"
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'dialog-error' : undefined}
            oninput={() => (error = '')}
          />
        </label>
        {#if error}<p id="dialog-error" class="error" role="alert">{error}</p>{/if}
      {:else}
        <p class="message">{req.message}</p>
      {/if}
      <div class="actions">
        <button type="button" class="btn" onclick={() => finish(null)}>Cancel</button>
        <button
          type="submit"
          class="btn primary"
          class:danger={req.kind === 'confirm' && req.danger}
          >{req.kind === 'prompt' ? req.submitLabel : req.confirmLabel}</button
        >
      </div>
    </form>
  {/if}
</dialog>

<style>
  .dialog {
    width: min(420px, calc(100vw - 32px));
    padding: var(--space-5);
    border: 1px solid var(--border);
    border-radius: var(--radius-2);
    background: var(--surface);
    color: var(--text);
    box-shadow: var(--shadow);
  }
  .dialog::backdrop {
    background: rgb(0 0 0 / 40%);
  }
  h2 {
    margin: 0 0 var(--space-4);
    font-size: var(--text-lg);
  }
  .field {
    display: grid;
    gap: var(--space-1);
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  input {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-1);
    background: var(--bg);
    color: var(--text);
    font-size: var(--text-md);
  }
  input[aria-invalid='true'] {
    border-color: var(--error);
  }
  .error {
    margin: var(--space-2) 0 0;
    color: var(--error);
    font-size: var(--text-sm);
  }
  .message {
    margin: 0;
    overflow-wrap: anywhere;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    margin-top: var(--space-5);
  }
  .btn {
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-1);
    background: var(--surface);
    cursor: pointer;
  }
  .btn.primary {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-text);
    font-weight: 600;
  }
  .btn.danger {
    background: var(--error);
    border-color: var(--error);
    color: #fff;
  }
</style>
