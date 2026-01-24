<script lang="ts">
  import { onMount } from 'svelte';
  import PairResults from './PairResults.svelte';
  import type { Player } from '../lib/match';
  import { pairPlayers } from '../lib/match';

  let textarea = '';
  let players: Player[] = [];
  let pairs: [Player, Player][] = [];

  function parsePlayers(text: string) {
    return text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((name, i) => ({ id: String(i + 1), name }));
  }

  function generate() {
    players = parsePlayers(textarea);
    pairs = pairPlayers(players);
  }

  // Example seed players for demo
  onMount(() => {
    if (!textarea) textarea = 'Aitor\nBea\nCarlos\nDani\nElena\nFermin\nGorka\nHana';
  });
</script>

<style>
  textarea { width: 100%; height: 120px; }
  .controls { margin-top: 8px; }
</style>

<div>
  <label for="players">Jugadores (una línea por jugador):</label>
  <textarea id="players" bind:value={textarea} placeholder="Nombre\n..." />
  <div class="controls">
    <button on:click={generate}>Generate Pairs</button>
  </div>

  {#if pairs.length}
    <PairResults {pairs} />
  {/if}
</div>
