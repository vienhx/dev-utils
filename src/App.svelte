<script lang="ts">
  import { onDestroy } from 'svelte';
  import Dialogs from './shell/Dialogs.svelte';
  import Icon from './shell/Icon.svelte';
  import { icons } from './shell/icons';
  import { viewport } from './shell/media.svelte';
  import { prefs } from './shell/prefs.svelte';
  import { route, startRouter } from './shell/route.svelte';
  import Sidebar from './shell/Sidebar.svelte';
  import Toast from './shell/Toast.svelte';
  import { getTool, tools } from './shell/tools';

  onDestroy(startRouter());

  const tool = $derived(getTool(route.tool) ?? tools[0]!);
  const loaded = $derived(tool.load());

  let drawer: HTMLDialogElement | undefined = $state();
  let drawerOpen = $state(false);

  function openDrawer() {
    drawer?.showModal();
    drawerOpen = true;
  }

  function closeDrawer() {
    drawer?.close();
  }

  // A tap on the backdrop targets the dialog itself, not its content.
  function onDrawerClick(e: MouseEvent) {
    if (e.target === drawer) closeDrawer();
  }

  $effect(() => {
    void route.tool;
    void route.params;
    if (drawer?.open) closeDrawer();
  });
</script>

<div
  class="shell"
  class:mobile={viewport.mobile}
  class:collapsed={!viewport.mobile && prefs.sidebarCollapsed}
>
  {#if viewport.mobile}
    <header class="topbar">
      <button
        class="menu-btn"
        aria-label="Open menu"
        aria-expanded={drawerOpen}
        aria-controls="drawer"
        onclick={openDrawer}
        data-testid="menu-button"
      >
        <Icon d={icons.menu} size={20} />
      </button>
      <span class="title">{tool.name}</span>
    </header>
    <dialog
      id="drawer"
      class="drawer"
      bind:this={drawer}
      aria-label="Navigation"
      onclick={onDrawerClick}
      onclose={() => (drawerOpen = false)}
      data-testid="drawer"
    >
      <Sidebar mode="drawer" onNavigate={closeDrawer} />
    </dialog>
  {:else}
    <aside class="side">
      <Sidebar mode={prefs.sidebarCollapsed ? 'rail' : 'full'} />
    </aside>
  {/if}

  <main class="content" data-testid="content">
    {#await loaded then mod}
      <mod.default />
    {:catch}
      <p class="load-error">This tool failed to load. Reload the page to try again.</p>
    {/await}
  </main>
</div>

<Toast />
<Dialogs />

<style>
  .shell {
    display: grid;
    grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
    min-height: 100%;
  }
  .shell.collapsed {
    grid-template-columns: var(--rail-width) minmax(0, 1fr);
  }
  .shell.mobile {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: var(--topbar-height) minmax(0, 1fr);
  }
  .side {
    position: sticky;
    top: 0;
    height: 100vh;
    height: 100dvh;
    border-right: 1px solid var(--border);
    z-index: 20;
  }
  .content {
    min-width: 0;
  }
  .topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0 var(--space-2);
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .menu-btn {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: var(--radius-1);
    background: transparent;
    cursor: pointer;
  }
  .title {
    font-weight: 600;
  }
  .drawer {
    margin: 0;
    width: min(280px, 85vw);
    max-width: none;
    height: 100%;
    max-height: none;
    padding: 0;
    border: 0;
    border-right: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
  }
  .drawer[open] {
    animation: slide 0.16s ease-out;
  }
  .drawer::backdrop {
    background: rgb(0 0 0 / 40%);
  }
  @keyframes slide {
    from {
      transform: translateX(-100%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .drawer[open] {
      animation: none;
    }
  }
  .load-error {
    padding: var(--space-5);
    color: var(--error);
  }
</style>
