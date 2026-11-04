<script lang="ts">
  import Icon from './Icon.svelte';
  import { icons } from './icons';
  import { dismissToast, toast } from './toast-state.svelte';

  function runAction() {
    // Read the action before dismissing, which clears the toast.
    const run = toast.current?.action?.run;
    dismissToast();
    run?.();
  }
</script>

<div class="region" role="status" aria-live="polite">
  {#if toast.current}
    {@const t = toast.current}
    {#key t.id}
      <div class="toast" class:error={t.tone === 'error'} data-testid="toast">
        <span class="msg">{t.message}</span>
        {#if t.action}
          <button class="action" onclick={runAction}>{t.action.label}</button>
        {/if}
        <button class="close" aria-label="Dismiss" onclick={dismissToast}
          ><Icon d={icons.x} size={14} /></button
        >
      </div>
    {/key}
  {/if}
</div>

<style>
  .region {
    position: fixed;
    inset: auto 0 var(--space-4) 0;
    display: flex;
    justify-content: center;
    pointer-events: none;
    z-index: 50;
    padding: 0 var(--space-4);
  }
  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    max-width: 100%;
    padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
    border-radius: var(--radius-2);
    background: var(--text);
    color: var(--bg);
    box-shadow: var(--shadow);
    animation: rise 0.16s ease-out;
  }
  .toast.error {
    background: var(--error);
    color: #fff;
  }
  .msg {
    overflow-wrap: anywhere;
  }
  button {
    border: 0;
    background: transparent;
    cursor: pointer;
    border-radius: var(--radius-1);
    padding: var(--space-1) var(--space-2);
  }
  .action {
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .close {
    display: grid;
    place-items: center;
    opacity: 0.75;
  }
  @keyframes rise {
    from {
      transform: translateY(8px);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .toast {
      animation: none;
    }
  }
</style>
