<script lang="ts">
  import Match from './Match.svelte';
  export let round: Array<{ id: number; a: string; b: string }> = [];
  export let rIndex: number = 0;
  export let totalRounds: number = 1;
  export let isOuter: boolean = false; // show matches at corners when true
  export let isFinal: boolean = false; // highlight final
  export let splitMatches: boolean = true; // whether to split matches into top/bottom when outer
  const hasNext = rIndex < totalRounds - 1;
  // For outer rounds we split matches into top and bottom groups so they anchor to corners
  $: topMatches = [] as typeof round;
  $: bottomMatches = [] as typeof round;
  $: if (isOuter && splitMatches) {
    const half = Math.ceil(round.length / 2);
    topMatches = round.slice(0, half);
    bottomMatches = round.slice(half);
  } else {
    topMatches = [];
    bottomMatches = [];
  }
</script>

<div class="min-w-[180px] bg-white border border-slate-100 rounded p-2 shadow-sm">
  <h4 class="text-sm font-semibold mb-1 text-slate-700">{isFinal ? 'Final' : `Round ${rIndex + 1}`}</h4>

  {#if isOuter}
    <div class="flex flex-col justify-between h-full">
      <div class="flex flex-col gap-2">
        {#each topMatches as m}
          <Match a={m.a} b={m.b} hasNext={hasNext} />
        {/each}
      </div>

      <div class="flex flex-col gap-2">
        {#each bottomMatches as m}
          <Match a={m.a} b={m.b} hasNext={hasNext} />
        {/each}
      </div>
    </div>
  {:else}
    <div class="flex flex-col gap-3">
      {#each round as m, i}
        <Match a={m.a} b={m.b} hasNext={hasNext} />
      {/each}
    </div>
  {/if}

</div>
