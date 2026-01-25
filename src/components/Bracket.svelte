<script lang="ts">
  import Round from './Round.svelte';
  export let bracket: Array<Array<{ id: number; a: string; b: string }>> = [];
</script>

<div>
  {#if bracket.length === 0}
    <div class="text-sm text-slate-500">No bracket to show</div>
  {:else}
      {#if bracket.length === 1}
      <!-- Single final only (compact) -->
      <div class="flex justify-center items-center h-auto">
        <Round round={bracket[0]} rIndex={0} totalRounds={1} isFinal={true} />
      </div>
    {:else}
      <!-- Split every pre-final round into top/bottom halves and distribute left/right -->
      {@const pre = bracket.slice(0, bracket.length - 1)}
      {@const left = []}
      {@const right = []}
      {@html ''}
      {@const _ = pre.forEach((r, i) => {
        const half = Math.ceil(r.length / 2);
        left.push({ round: r.slice(0, half), idx: i, splitHalf: true });
        right.push({ round: r.slice(half), idx: i, splitHalf: true });
      })}
      {@const rightReversed = right.slice().reverse()}

      <div class="grid grid-cols-[1fr_auto_1fr] items-stretch gap-4 h-auto">
        <!-- Left side rounds (even indices and outer half) -->
        <div class="flex items-stretch gap-6">
          {#each left as item}
            <Round round={item.round} rIndex={item.idx} totalRounds={bracket.length} isOuter={item.idx === 0} splitMatches={!item.splitHalf} />
          {/each}
        </div>

        <!-- Center final -->
        <div class="flex items-center justify-center">
          <Round round={bracket[bracket.length - 1]} rIndex={bracket.length - 1} totalRounds={bracket.length} isFinal={true} />
        </div>

        <!-- Right side rounds (mirrored - odd indices and outer half) -->
        <div class="flex items-stretch gap-6 justify-end">
          {#each rightReversed as item, ridx}
            <Round round={item.round} rIndex={item.idx} totalRounds={bracket.length} isOuter={item.idx === 0} splitMatches={!item.splitHalf} />
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>