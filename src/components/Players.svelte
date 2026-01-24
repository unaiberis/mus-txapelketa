<script lang="ts">
  import { onMount } from 'svelte';
  import PairResults from './PairResults.svelte';
  import Bracket from './Bracket.svelte';
  import type { Player } from '../lib/match';
  import { pairPlayers } from '../lib/match';

  let textarea = '';
  let players: Player[] = [];
  let pairs: [Player, Player][] = [];
  let selected: Set<string> = new Set();
  let bracket: any = null;

  function parsePlayers(text: string) {
    return text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((name, i) => ({ id: String(i + 1), name }));
  }

  function importPlayers() {
    const parsed = parsePlayers(textarea);
    // Reassign stable ids if players list exists
    players = parsed.map((p, i) => ({ ...p, id: String(i + 1) }));
    pairs = [];
    selected.clear();
    bracket = null;
  }

  function toggleSelect(id: string) {
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
  }

  function addPairFromSelection() {
    if (selected.size !== 2) return;
    const ids = Array.from(selected);
    const a = players.find((p) => p.id === ids[0])!;
    const b = players.find((p) => p.id === ids[1])!;
    pairs = [...pairs, [a, b]];
    selected.clear();
  }

  function removePair(index: number) {
    pairs = pairs.filter((_, i) => i !== index);
  }

  function autoGeneratePairs() {
    if (players.length < 2) return;
    pairs = pairPlayers(players);
  }

  function generateBracket() {
    // Build a simple knockout bracket from pairs
    const seeds = pairs.map((p) => ({ a: p[0].name, b: p[1].name }));
    bracket = buildBracketFromPairs(seeds);
  }

  function buildBracketFromPairs(seeds: Array<{ a: string; b: string }>) {
    // First round matches are seeds; next rounds have placeholders for winners
    const rounds = [] as any[];
    let current = seeds.map((m, i) => ({ id: i + 1, a: m.a, b: m.b }));
    rounds.push(current);
    while (current.length > 1) {
      const next = [] as any[];
      for (let i = 0; i < Math.ceil(current.length / 2); i++) {
        next.push({ id: i + 1, a: `Winner of ${2 * i + 1}`, b: `Winner of ${2 * i + 2}` });
      }
      rounds.push(next);
      current = next;
    }
    return rounds;
  }

  // Example seed players for demo
  onMount(() => {
    if (!textarea) textarea = 'Aitor\nBea\nCarlos\nDani\nElena\nFermin\nGorka\nHana';
    importPlayers();
  });
</script>

<style>
  textarea { width: 100%; height: 120px; }
  .controls { margin-top: 8px; display:flex; gap:8px; }
  .players { display:flex; gap:16px; margin-top:12px; }
  .player-list { border:1px solid #ddd; padding:8px; min-width:220px }
  .player { cursor:pointer; padding:4px; }
  .player.selected { background:#def }
</style>

<div>
  <label for="players">Jugadores (una línea por jugador):</label>
  <textarea id="players" bind:value={textarea} placeholder="Nombre\n..."></textarea>
  <div class="controls">
    <button on:click={importPlayers}>Import Players</button>
    <button on:click={autoGeneratePairs}>Auto-generate Pairs</button>
    <button on:click={addPairFromSelection}>Add Pair from selection (select 2)</button>
    <button on:click={generateBracket}>Generate Bracket</button>
  </div>

  <div class="players">
    <div class="player-list">
      <h3>Players</h3>
      {#each players as p}
        <div class="player {selected.has(p.id) ? 'selected' : ''}" on:click={() => toggleSelect(p.id)}>{p.name}</div>
      {/each}
    </div>

    <div>
      <PairResults {pairs} on:removePair={(e) => removePair(e.detail)} />
    </div>

    <div>
      {#if bracket}
        <Bracket {bracket} />
      {/if}
    </div>
  </div>
</div>
