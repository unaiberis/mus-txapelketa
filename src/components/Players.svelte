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

  // Simple runtime style check report (used by debug UI)
  let styleReport: string[] = [];

  // Reactive flag for enabling add-by-name button
  $: canAddPairByNames = pairAName.trim().length > 0 && pairBName.trim().length > 0;

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

  function autoGeneratePairs() {
    if (players.length < 2) return;
    pairs = pairPlayers(players);
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

  // Runtime style checks (console logs + on-page report)
  function runStyleChecks() {
    const results: string[] = [];
    try {
      const header = document.querySelector('h1.text-sky-700');
      if (header) results.push(`h1.text-sky-700 color: ${getComputedStyle(header as Element).color}`);
      else results.push('h1.text-sky-700 not found');

      const mainEl = document.querySelector('main');
      if (mainEl) results.push(`main background: ${getComputedStyle(mainEl as Element).backgroundColor}`);

      const temp = document.createElement('div');
      temp.className = 'bracket'; temp.style.position = 'absolute'; temp.style.left = '-9999px';
      document.body.appendChild(temp);
      results.push(`.bracket display: ${getComputedStyle(temp).display}`);
      temp.remove();

      const s = document.createElement('div'); s.className = 'shadow-sm'; s.style.position='absolute'; s.style.left='-9999px'; document.body.appendChild(s);
      results.push(`shadow-sm boxShadow: ${getComputedStyle(s).boxShadow || 'none'}`);
      s.remove();

    } catch (err) {
      results.push('error: ' + err);
    }
    styleReport = results;
    console.group('Style checks'); results.forEach(r => console.log(r)); console.groupEnd();
    return results;
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

    // Run style checks on mount and shortly after (handles delayed style injection)
    runStyleChecks();
    setTimeout(runStyleChecks, 500);
  });
</script>

<div class="space-y-4">
  <div class="text-xs text-slate-500 mb-2 flex items-center gap-2">
    <div><strong>Style checks:</strong> {#if styleReport.length}
        {styleReport.join(' | ')}
      {:else}
        running...
      {/if}</div>
    <button class="ml-2 px-2 py-1 bg-slate-100 rounded text-xs" on:click={runStyleChecks}>Re-run</button>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
    <!-- Left: Player input & list -->
    <div class="space-y-3">
      <label for="players" class="text-sm font-medium text-slate-700">Jugadores (una línea por jugador):</label>
      <textarea id="players" bind:value={textarea} placeholder="Nombre\n..." class="w-full border rounded p-3 h-40 resize-none"></textarea>

      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex gap-2">
          <button class="px-3 py-2 bg-sky-600 text-white rounded shadow" on:click={importPlayers}>Import Players</button>
          <button class="px-3 py-2 bg-white border rounded" on:click={autoGeneratePairs}>Auto Pairs</button>
          <button class="px-3 py-2 bg-white border rounded" on:click={() => { players = []; pairs = []; selected.clear(); savePlayersToStorage([]); }}>Clear</button>
        </div>
        <div class="flex gap-2 items-center">
          <input class="border rounded px-3 py-2" placeholder="Player A" bind:value={pairAName} on:input={() => pairAName = pairAName} />
          <input class="border rounded px-3 py-2" placeholder="Player B" bind:value={pairBName} on:input={() => pairBName = pairBName} />
          <button type="button" class="px-4 py-2 bg-green-600 text-white rounded shadow disabled:opacity-50" on:click={addPairByNames} disabled={!canAddPairByNames} aria-disabled={!canAddPairByNames}>Add Pair</button>
        </div>
      </div>

      <div class="bg-slate-50 border border-slate-200 rounded p-3 max-h-80 overflow-auto mt-2">
        <h4 class="text-sm font-semibold mb-2">Players</h4>
        <div class="space-y-1">
          {#each players as p}
            <div class="flex items-center justify-between p-2 rounded hover:bg-white" on:click={() => toggleSelect(p.id)}>
              <div class="flex items-center gap-2">
                <input type="checkbox" checked={selected.has(p.id)} on:change={() => toggleSelect(p.id)} />
                <span class="{selected.has(p.id) ? 'font-semibold text-sky-700' : ''}">{p.name}</span>
              </div>
              <small class="text-xs text-slate-400">#{p.id}</small>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Right: Pairs and bracket -->
    <div class="space-y-4">
      <PairResults {pairs} on:removePair={(e) => removePair(e.detail)} />

      <div class="flex gap-2">
        <button class="px-3 py-2 bg-gray-200 rounded" on:click={exportExcel}>Export Players</button>
        <button class="px-3 py-2 bg-gray-200 rounded" on:click={exportCSV}>Export Players CSV</button>
        <button class="px-3 py-2 bg-gray-200 rounded" on:click={() => { /* placeholder for export pairs */ }}>Export Pairs</button>
      </div>

      <div class="mt-2">
        {#if bracket}
          <Bracket {bracket} />
        {/if}
      </div>
    </div>
  </div>
</div>
