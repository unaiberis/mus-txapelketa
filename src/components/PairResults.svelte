<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let pairs: [ { id: string; name: string }, { id: string; name: string } ][] = [];
  const dispatch = createEventDispatcher();

  function remove(i: number) {
    dispatch('removePair', i);
  }
</script>

<style>
  .pair { padding: 4px 0; display:flex; gap:8px; align-items:center; }
  .remove { color: #b00; cursor:pointer; }
</style>

<div>
  <h2>Pairs</h2>
  <ul>
    {#each pairs as [a, b], i}
      <li class="pair">{i + 1}. {a.name} — {b.name} <span class="remove" on:click={() => remove(i)}>Remove</span></li>
    {/each}
  </ul>
</div>
