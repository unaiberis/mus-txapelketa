<script lang="ts">
  import Match from './Match.svelte';
  export let round: Array<{ id: number; a: string; b: string }> = [];
  export let rIndex: number = 0;
</script>

<div class="min-w-[220px] bg-white border border-slate-100 rounded p-3 shadow-sm">
  <h4 class="text-sm font-semibold mb-2 text-slate-700">Round {rIndex + 1}</h4>
  {#each round as m}
    <Match a={m.a} b={m.b} />
  {/each}
</div>
