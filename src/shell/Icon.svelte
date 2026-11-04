<script lang="ts">
  let { d, size = 18 }: { d: string; size?: number } = $props();
</script>

<svg
  class="icon"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"><path {d} /></svg
>

<style>
  .icon {
    flex: none;
    display: block;
  }
</style>
