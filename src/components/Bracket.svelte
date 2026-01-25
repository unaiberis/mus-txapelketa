<script lang="ts">
  export let bracket: Array<Array<{ id: number; a: string; b: string }>> = [];
</script>

<div class="overflow-auto">
  <div class="flex gap-6">
    {#each bracket as round, rIndex}
      <div class="min-w-[220px] bg-white border border-slate-100 rounded p-3 shadow-sm">
        <h4 class="text-sm font-semibold mb-2 text-slate-700">Round {rIndex + 1}</h4>
        {#each round as m}
          <div class="py-2 border-t first:border-t-0">
            <div class="font-medium">{m.a}</div>
            <div class="text-sm text-slate-500">{m.b}</div>
          </div>
        {/each}
      </div>
    {/each}
  </div>
</div>