<script lang="ts">
  import { onMount } from 'svelte';
  let wrapperEl: HTMLElement | null = null;
</script>

<div class="brackets-side">
  <div id="brackets-viewer-wrapper" bind:this={wrapperEl} class="brackets-viewer mt-0 w-full min-h-[48px]" style="height: 100%; overflow: hidden;"></div>
</div> 

<style>
.brackets-side {
  width: 40%;
  min-width: 280px;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  overflow: visible;
  border-left: 1px solid #e5e7eb;
  background: var(--bg, #fff);
  padding: 0.25rem; /* reduce overall padding */
  z-index: 20;
} 

@media (max-width: 1024px) {
  .brackets-side { width: 100%; position: static; height: auto; border-left: none; padding: 0; }
}
</style> 