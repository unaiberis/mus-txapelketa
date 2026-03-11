<script lang="ts">
  import { onMount } from 'svelte';
  let wrapperEl: HTMLElement | null = null;
</script>

<div class="card-board felt-bg">
  <aside class="lg:sticky lg:top-16 lg:right-0 lg:w-2/5 md:w-1/3 w-full relative min-w-[220px] border-l-4 border-wood-700 p-3 bg-gradient-to-b from-tapete-900/5 to-transparent z-20" aria-label="Brackets viewer">
    <div id="brackets-viewer-wrapper" bind:this={wrapperEl} role="region" aria-label="Brackets viewer" class="container--center brackets-viewer mt-0 w-full min-h-[48px] rounded-lg overflow-auto bracket-frame matches-scroller" tabindex="-1"></div>
  </aside>
</div>