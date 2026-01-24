<script lang="ts">
  export let bracket: Array<Array<{ id: number; a: string; b: string }>> = [];
</script>

<style>
  .bracket { display:flex; gap:16px; margin-top:12px; }
  .round { border:1px solid #ddd; padding:8px; min-width:200px }
  .match { border-top:1px solid #eee; padding:6px 4px; }
  .match:first-child { border-top: none; }
</style>

<div class="bracket">
  {#each bracket as round, rIndex}
    <div class="round">
      <h4>Round {rIndex + 1}</h4>
      {#each round as m}
        <div class="match">
          <div><strong>{m.a}</strong></div>
          <div>{m.b}</div>
        </div>
      {/each}
    </div>
  {/each}
</div>