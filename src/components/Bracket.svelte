<script lang="ts">
  import Round from './Round.svelte';
  export let bracket: Array<Array<{ id: number; a: string; b: string }>> = [];
</script>

<div class="overflow-auto">
  <div class="flex gap-6">
    {#each bracket as round, rIndex}
      <Round {round} {rIndex} />
    {/each}
  </div>
</div>