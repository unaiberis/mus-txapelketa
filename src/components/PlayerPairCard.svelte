<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { t } from '../lib/i18n';
  export let pairs: [ { id: string; name: string }, { id: string; name: string } ][] = [];
  // When true the component only shows names (no Edit / Remove) so participants can view the bracket clearly
  export let viewOnly: boolean = false;
  // Optional: when provided, render these match labels (pairs of pair-names) instead of the regular `pairs`
  export let matchLabels: { a: string; b: string }[] = [];
  const dispatch = createEventDispatcher();

  // If we switch to view-only, cancel any in-progress edit
  $: if (viewOnly) cancelEdit();

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

  // Helpers to extract trailing "#N" suffix from labels and strip it for display
  function extractHash(s: string) {
    const m = (s || '').toString().match(/#(\d+)$/);
    return m ? `#${m[1]}` : '';
  }
  function stripHash(s: string) {
    return (s || '').toString().replace(/\s*#\d+$/, '');
  }
</script>

<div class="bg-slate-50 border border-slate-200 rounded p-2">
  <div class="flex items-center justify-between">
    <h2 class="text-sm font-semibold">{$t('pairsTitle')}</h2>
    <div class="text-sm text-slate-500">{$t('matchesCount', { count: (matchLabels && matchLabels.length > 0) ? matchLabels.length : pairs.length })}</div>
  </div>

  <div class="mt-2">
    {#if matchLabels && matchLabels.length > 0}
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {#each matchLabels as m, i}
          <div class="bg-white border rounded-md px-2 py-2 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between mb-2">
              <div class="text-xxs text-slate-400">{$t('table_short', { n: i + 1 })}</div>
            </div>
            <div class="flex flex-col gap-1">
              <div class="bg-slate-50 border border-slate-100 rounded px-2 py-1 text-sm font-medium truncate flex items-center gap-2">
                {#if extractHash(m.a)}
                  <div class="text-xxs text-slate-400 w-10 flex-shrink-0">{extractHash(m.a)}</div>
                {/if}
                <div class="truncate">{stripHash(m.a)}</div>
              </div>
              <div class="bg-slate-50 border border-slate-100 rounded px-2 py-1 text-sm font-medium truncate flex items-center gap-2">
                {#if extractHash(m.b)}
                  <div class="text-xxs text-slate-400 w-10 flex-shrink-0">{extractHash(m.b)}</div>
                {/if}
                <div class="truncate">{stripHash(m.b)}</div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      {#if pairs.length === 0}
        <div class="text-sm text-slate-500">{$t('noPairs')}</div>
      {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
          {#each pairs as [a, b], i}
            <div class="bg-white border rounded-md px-2 py-1 shadow-sm flex items-center justify-between gap-3 hover:shadow-md transition">

              {#if editingIndex === i}
                <div class="flex items-center gap-2 w-full">
                  <div class="text-xxs text-slate-400 w-6">#{i + 1}</div>
                  <input class="flex-1 border rounded px-2 py-1 text-xs" bind:value={editA} aria-label={$t('playerA')} />
                  <input class="w-36 border rounded px-2 py-1 text-xs" bind:value={editB} aria-label={$t('playerB')} />
                </div>
                <div class="flex gap-1 ml-2">
                  <button class="text-xxs px-2 py-0.5 bg-sky-600 text-white rounded" on:click={() => saveEdit(i)}>{$t('save')}</button>
                  <button class="text-xxs px-2 py-0.5 bg-white border rounded" on:click={cancelEdit}>{$t('cancel')}</button>
                </div>
              {:else}
                <div class="flex items-center gap-3 truncate">
                  <div class="text-xxs text-slate-400 w-6">#{i + 1}</div>
                  <div class="truncate">
                    <div class="font-medium text-slate-800 leading-tight truncate" class:text-base={viewOnly} class:text-sm={!viewOnly}>{a.name} <span class="text-slate-400 text-xxs">—</span> {b.name}</div>
                  </div>
                </div>

                {#if !viewOnly}
                  <div class="flex items-center gap-2">
                    <button class="text-xxs text-slate-500 hover:text-sky-600" on:click={() => startEdit(i)}>{$t('edit')}</button>
                    <button class="text-xxs text-red-600 hover:underline" on:click={() => remove(i)}>{$t('remove')}</button>
                  </div>
                {/if}
              {/if}

            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
/* tiny utility override for extra small text */
.text-xxs { font-size: 0.7rem; }
</style>