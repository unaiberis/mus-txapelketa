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
    dispatch('updatePair', { index: i, a: editA.trim(), b: editB.trim() });
    cancelEdit();
  }
</script>

<div class="bg-slate-50 border border-slate-200 rounded p-2">
  <div class="flex items-center justify-between">
    <h2 class="text-sm font-semibold">Pairs</h2>
    <div class="text-sm text-slate-500">{pairs.length} matches</div>
  </div>

  <div class="mt-2">
    {#if pairs.length === 0}
      <div class="text-sm text-slate-500">No hay parejas todavía.</div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
        {#each pairs as [a, b], i}
          <div class="bg-white border rounded-md px-2 py-1 shadow-sm flex items-center justify-between gap-3 hover:shadow-md transition">

            {#if editingIndex === i}
              <div class="flex items-center gap-2 w-full">
                <div class="text-xxs text-slate-400 w-6">#{i + 1}</div>
                <input class="flex-1 border rounded px-2 py-1 text-xs" bind:value={editA} aria-label="Jugador A" />
                <input class="w-36 border rounded px-2 py-1 text-xs" bind:value={editB} aria-label="Jugador B" />
              </div>
              <div class="flex gap-1 ml-2">
                <button class="text-xxs px-2 py-0.5 bg-sky-600 text-white rounded" on:click={() => saveEdit(i)}>Save</button>
                <button class="text-xxs px-2 py-0.5 bg-white border rounded" on:click={cancelEdit}>Cancel</button>
              </div>
            {:else}
              <div class="flex items-center gap-3 truncate">
                <div class="text-xxs text-slate-400 w-6">#{i + 1}</div>
                <div class="truncate">
                  <div class="font-medium text-slate-800 text-sm leading-tight truncate">{a.name} <span class="text-slate-400 text-xxs">—</span> {b.name}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button class="text-xxs text-slate-500 hover:text-sky-600" on:click={() => startEdit(i)}>Edit</button>
                <button class="text-xxs text-red-600 hover:underline" on:click={() => remove(i)}>Remove</button>
              </div>
            {/if}

          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
/* tiny utility override for extra small text */
.text-xxs { font-size: 0.7rem; }
</style>