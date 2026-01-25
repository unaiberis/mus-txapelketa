<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let pairs: [ { id: string; name: string }, { id: string; name: string } ][] = [];
  const dispatch = createEventDispatcher();

  function remove(i: number) {
    dispatch('removePair', i);
  }

  // Inline editing state
  let editingIndex: number | null = null;
  let editA = '';
  let editB = '';

  function startEdit(i: number) {
    editingIndex = i;
    editA = pairs[i][0].name;
    editB = pairs[i][1].name;
  }

  function cancelEdit() {
    editingIndex = null;
    editA = '';
    editB = '';
  }

  function saveEdit(i: number) {
    // Emit a generic update event with new names; parent will resolve or create players
    dispatch('updatePair', { index: i, a: editA.trim(), b: editB.trim() });
    cancelEdit();
  }

  // Visualización: usaremos una cuadrícula (grid) responsiva de hasta 4 columnas para reducir la altura

</script>

<div class="bg-slate-50 border border-slate-200 rounded p-4">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-semibold">Pairs</h2>
    <div class="text-sm text-slate-500">{pairs.length} matches</div>
  </div>

  <div class="mt-3">
    {#if pairs.length === 0}
      <div class="text-sm text-slate-500">No hay parejas todavía.</div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {#each pairs as [a, b], i}
          <div class="bg-white border rounded p-3 shadow-sm">
            <div class="text-xs text-slate-400 mb-1">#{i + 1}</div>

            {#if editingIndex === i}
              <input class="w-full border rounded px-2 py-1 text-sm" bind:value={editA} aria-label="Jugador A" />
              <input class="w-full border rounded px-2 py-1 text-sm mt-1" bind:value={editB} aria-label="Jugador B" />
              <div class="flex gap-2 justify-end mt-2">
                <button class="text-xs px-2 py-1 bg-sky-600 text-white rounded" on:click={() => saveEdit(i)}>Save</button>
                <button class="text-xs px-2 py-1 bg-white border rounded" on:click={cancelEdit}>Cancel</button>
              </div>
            {:else}
              <div class="font-medium text-slate-800">{a.name}</div>
              <div class="font-medium text-slate-800 mt-1">{b.name}</div>
              <div class="flex gap-2 justify-end mt-2">
                <button class="text-xs text-slate-500" on:click={() => startEdit(i)}>Edit</button>
                <button class="text-xs text-red-600" on:click={() => remove(i)}>Remove</button>
              </div>
            {/if}

          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>