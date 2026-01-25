<script lang="ts">
  import { onMount } from 'svelte';
  import PairResults from './PairResults.svelte';
  import Bracket from './Bracket.svelte';
  import type { Player } from '../lib/match';
  import { pairPlayers } from '../lib/match';
  import * as XLSX from 'xlsx';
  import { savePlayersToStorage, loadPlayersFromStorage, savePairsToStorage, loadPairsFromStorage } from '../lib/storage';

  let textarea = '';
  let players: Player[] = [];
  let pairs: [Player, Player][] = [];
  let selected: Set<string> = new Set();
  let bracket: any = null;

  // Inputs for manual pair entry
  let pairAName = '';
  let pairBName = '';

  // Reactive flag for enabling add-by-name button
  $: canAddPairByNames = pairAName.trim().length > 0 && pairBName.trim().length > 0;
  // Debug: log inputs and computed flag whenever they change
  $: console.log('pair inputs:', JSON.stringify(pairAName), JSON.stringify(pairBName), 'trim lengths', pairAName.trim().length, pairBName.trim().length, 'canAddPairByNames', canAddPairByNames);

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
    savePlayersToStorage(players);
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
    savePairsToStorage(pairs.map((p) => ({ a: p[0].name, b: p[1].name })));
  }

  function addPairByNames() {
    console.log('addPairByNames called', { pairAName, pairBName, canAddPairByNames });
    const aName = pairAName.trim();
    const bName = pairBName.trim();
    if (!aName || !bName) return;
    // Ensure players exist (case-sensitive by name)
    const findOrCreate = (name: string) => {
      let p = players.find((x) => x.name === name);
      if (!p) {
        const maxId = players.reduce((m, x) => Math.max(m, Number(x.id)), 0);
        p = { id: String(maxId + 1), name };
        players = [...players, p];
        savePlayersToStorage(players);
      }
      return p;
    };
    const a = findOrCreate(aName);
    const b = findOrCreate(bName);
    pairs = [...pairs, [a, b]];
    pairAName = '';
    pairBName = '';
    savePairsToStorage(pairs.map((p) => ({ a: p[0].name, b: p[1].name })));
  }

  function removePair(index: number) {
    pairs = pairs.filter((_, i) => i !== index);
    savePairsToStorage(pairs.map((p) => ({ a: p[0].name, b: p[1].name })));
  }

  function updatePair(detail: { index: number; a: string; b: string }) {
    const { index, a: aName, b: bName } = detail;
    const aTrim = aName.trim();
    const bTrim = bName.trim();
    if (!aTrim || !bTrim) return;

    // Helper to find or create a player by name
    const findOrCreate = (name: string) => {
      let p = players.find((x) => x.name === name);
      if (!p) {
        const maxId = players.reduce((m, x) => Math.max(m, Number(x.id)), 0);
        p = { id: String(maxId + 1), name };
        players = [...players, p];
        savePlayersToStorage(players);
      }
      return p;
    };

    const aPlayer = findOrCreate(aTrim);
    const bPlayer = findOrCreate(bTrim);

    pairs = pairs.map((p, i) => (i === index ? [aPlayer, bPlayer] : p));
    savePairsToStorage(pairs.map((p) => ({ a: p[0].name, b: p[1].name })));
  }

  function autoGeneratePairs() {
    if (players.length < 2) return;
    pairs = pairPlayers(players);
    savePairsToStorage(pairs.map((p) => ({ a: p[0].name, b: p[1].name })));
  }

  // Create 64 random pairs (128 players) with generated names
  function create64Pairs() {
    const totalPlayers = 128;
    const newPlayers: Player[] = [];
    for (let i = 0; i < totalPlayers; i++) {
      newPlayers.push({ id: String(i + 1), name: `Jugador ${i + 1}` });
    }
    players = newPlayers;
    textarea = players.map((p) => p.name).join('\n');
    pairs = pairPlayers(players);
    selected.clear();
    bracket = null;
    savePlayersToStorage(players);
    savePairsToStorage(pairs.map((p) => ({ a: p[0].name, b: p[1].name })));
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

  function exportExcel() {
    const data = players.map((p) => ({ Name: p.name }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Players');
    XLSX.writeFile(wb, 'players.xlsx');
  }

  function exportCSV() {
    const csv = players.map((p) => p.name).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'players.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const first = wb.SheetNames[0];
      const ws = wb.Sheets[first];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[];
      const names = rows.flat().map(String).map((s) => s.trim()).filter(Boolean);
      textarea = names.join('\n');
      importPlayers();
      // reset input
      input.value = '';
    };
    reader.readAsArrayBuffer(file);
  }

  // Example seed players for demo
  onMount(() => {
    console.log('Players component hydrated on client (onMount)');
    const stored = loadPlayersFromStorage();
    if (stored && stored.length) {
      players = stored;
      textarea = players.map((p) => p.name).join('\n');
    } else {
      textarea = 'Aitor\nBea\nCarlos\nDani\nElena\nFermin\nGorka\nHana';
      importPlayers();
    }

    // Load pairs from storage (if any)
    const storedPairs = loadPairsFromStorage();
    if (storedPairs && storedPairs.length) {
      // Ensure players list includes any names from pairs
      for (const sp of storedPairs) {
        if (!players.find((p) => p.name === sp.a)) {
          const maxId = players.reduce((m, x) => Math.max(m, Number(x.id)), 0);
          players = [...players, { id: String(maxId + 1), name: sp.a }];
        }
        if (!players.find((p) => p.name === sp.b)) {
          const maxId = players.reduce((m, x) => Math.max(m, Number(x.id)), 0);
          players = [...players, { id: String(maxId + 1), name: sp.b }];
        }
      }
      // Map names to player objects
      pairs = storedPairs.map((sp) => {
        const a = players.find((p) => p.name === sp.a)!;
        const b = players.find((p) => p.name === sp.b)!;
        return [a, b] as [Player, Player];
      });
    }

  });
</script>

<div class="space-y-4">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
    <!-- Left: Player input & list -->
    <div class="space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex gap-2">
          <button class="px-3 py-2 bg-sky-600 text-white rounded shadow" on:click={importPlayers}>Import Players</button>
          <button class="px-3 py-2 bg-white border rounded" on:click={autoGeneratePairs}>Auto Pairs</button>
          <button class="px-3 py-2 bg-indigo-600 text-white rounded shadow" on:click={create64Pairs} aria-label="Crear 64 parejas aleatorias">Crear 64 parejas</button>
          <button class="px-3 py-2 bg-white border rounded" on:click={() => { players = []; pairs = []; selected.clear(); savePlayersToStorage([]); }}>Clear</button>
        </div>
        <div class="flex gap-2 items-center">
          <input class="border rounded px-3 py-2" placeholder="Player A" bind:value={pairAName} on:input={() => console.log('Player A input', JSON.stringify(pairAName), 'trimLen', pairAName.trim().length)} />
          <input class="border rounded px-3 py-2" placeholder="Player B" bind:value={pairBName} on:input={() => console.log('Player B input', JSON.stringify(pairBName), 'trimLen', pairBName.trim().length)} />
          <button type="button" class="px-4 py-2 bg-green-600 text-white rounded shadow disabled:opacity-50" on:click={addPairByNames} disabled={! (pairAName.trim().length > 0 && pairBName.trim().length > 0) } aria-disabled={! (pairAName.trim().length > 0 && pairBName.trim().length > 0) }>Add Pair</button>
        </div>
      </div>
    </div>

    <!-- Right: removed (moved below) -->

  </div>

  <!-- Right: Pairs and bracket (moved here) -->
  <div class="space-y-4 mt-6">
    <PairResults {pairs} on:removePair={(e) => removePair(e.detail)} on:updatePair={(e) => updatePair(e.detail)} />

    <div class="flex gap-2">
      <button class="px-3 py-2 bg-gray-200 rounded" on:click={exportExcel}>Export Players</button>
      <button class="px-3 py-2 bg-gray-200 rounded" on:click={exportCSV}>Export Players CSV</button>
      <button class="px-3 py-2 bg-gray-200 rounded" on:click={() => { /* placeholder for export pairs */ }}>Export Pairs</button>
    </div>
  </div>
</div>
