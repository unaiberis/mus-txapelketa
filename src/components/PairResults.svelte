<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let pairs: [ { id: string; name: string }, { id: string; name: string } ][] = [];
  const dispatch = createEventDispatcher();

  function remove(i: number) {
    dispatch('removePair', i);
  }
</script>

<style>
  /* small custom style preserved */
</style>

<div class="bg-slate-50 border border-slate-200 rounded p-4">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-semibold">Pairs</h2>
    <div class="text-sm text-slate-500">{pairs.length} matches</div>
  </div>

  <ul class="mt-3 space-y-2">
    {#each pairs as [a, b], i}
      <li class="flex items-center justify-between bg-white border rounded p-3 shadow-sm">
        <div class="text-sm"><span class="text-slate-600">{i + 1}.</span> <span class="font-medium">{a.name}</span> <span class="text-slate-400">—</span> <span class="font-medium">{b.name}</span></div>
        <div class="flex items-center gap-2">
          <button class="text-sm text-slate-500" on:click={() => { /* future: edit pair */ }}>Edit</button>
          <button class="text-sm text-red-600" on:click={() => remove(i)}>Remove</button>
        </div>
      </li>
    {/each}
  </ul>
</div>
<div>
  <h2>Pairs</h2>
  <ul>
    {#each pairs as [a, b], i}
      <li class="pair">{i + 1}. {a.name} — {b.name} <span class="remove" on:click={() => remove(i)}>Remove</span></li>
    {/each}
  </ul>
</div>
