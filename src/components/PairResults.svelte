<script lang="ts">
  export let pairs: [ { id: string; name: string }, { id: string; name: string } ][] = [];
</script>

<style>
  .pair { padding: 4px 0; }
</style>

<div>
  <h2>Pairs</h2>
  <ul>
    {#each pairs as [a, b], i}
      <li class="pair">{i + 1}. {a.name} — {b.name}</li>
    {/each}
  </ul>
</div>
