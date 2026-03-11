<script lang="ts">
  import Round from './Round.svelte';
  export let bracket: Array<Array<{ id: number; a: string; b: string }>> = [];
</script>

<div class="card-board" role="region" aria-label="Bracket">
  {#if bracket.length === 0}
    <div class="text-sm text-slate-500">No bracket to show</div>
  {:else}
    {#if bracket.length === 1}
      <div class="flex justify-center items-center h-auto">
        <Round round={bracket[0]} rIndex={0} totalRounds={1} isFinal={true} />
      </div>
    {:else}
      {@const pre = bracket.slice(0, bracket.length - 1)}
      {@const left: any[] = []}
      {@const right: any[] = []}
      {@html ''}
      {@const _ = pre.forEach((r, i) => {
        const half = Math.ceil(r.length / 2);
        left.push({ round: r.slice(0, half), idx: i, splitHalf: true });
        right.push({ round: r.slice(half), idx: i, splitHalf: true });
      })}

      <div class="grid lg:grid-cols-[1fr_auto_1fr] grid-cols-1 items-stretch gap-4 h-auto overflow-x-auto container--center">
        <div class="flex items-stretch gap-6" role="list">
          {#each left as item}
            <div class="match-row" role="listitem">
              <Round round={item.round} rIndex={item.idx} totalRounds={bracket.length} isOuter={item.idx === 0} splitMatches={!item.splitHalf} />
            </div>
          {/each}
        </div>

        <div class="flex items-center justify-center h-12 md:h-12 sm:h-10">
          <div class="match-row">
            <Round round={bracket[bracket.length - 1]} rIndex={bracket.length - 1} totalRounds={bracket.length} isFinal={true} />
          </div>
        </div>

        <div class="flex items-stretch gap-6 justify-end" role="list">
          {#each right.slice().reverse() as item}
            <div class="match-row" role="listitem">
              <Round round={item.round} rIndex={item.idx} totalRounds={bracket.length} isOuter={item.idx === 0} splitMatches={!item.splitHalf} />
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>