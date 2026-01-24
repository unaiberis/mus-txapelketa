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

<div class="">
  <h2 class="text-xl font-medium">Pairs</h2>
  <ul class="mt-3 space-y-2">
    {#each pairs as [a, b], i}
      <li class="flex items-center justify-between bg-slate-50 border border-slate-200 rounded p-3">
        <div>{i + 1}. <span class="font-medium">{a.name}</span> — <span class="font-medium">{b.name}</span></div>
        <button class="text-sm text-red-600" on:click={() => remove(i)}>Remove</button>
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
