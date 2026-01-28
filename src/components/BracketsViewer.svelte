<script lang="ts">
  import { onMount } from 'svelte';
  let wrapperEl: HTMLElement | null = null;
</script>

<div class="brackets-side border-l-4 border-wood-700 bg-gradient-to-b from-tapete-900/5 to-transparent">
  <div id="brackets-viewer-wrapper" bind:this={wrapperEl} class="brackets-viewer mt-0 w-full min-h-[48px] bracket-frame" style="height: 100%; overflow: hidden;"></div>
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
  border-left: 6px solid var(--wood1);
  background: linear-gradient(180deg, rgba(8,44,36,0.03), rgba(0,0,0,0.02));
  padding: 0.5rem; /* reduce overall padding */
  z-index: 20;
  display: flex; align-items: stretch; justify-content: center;
} 

@media (max-width: 1024px) {
  .brackets-side { width: 100%; position: static; height: auto; border-left: none; padding: 0; }
}

@media (max-width: 1024px) {
  .brackets-side { width: 100%; position: static; height: auto; border-left: none; padding: 0; }
}
</style> 