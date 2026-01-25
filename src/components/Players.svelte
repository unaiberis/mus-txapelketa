<script lang="ts">
  import { onMount, tick, onDestroy } from 'svelte';
  import PlayerPairCard from './PlayerPairCard.svelte';
  import BracketsViewer from './BracketsViewer.svelte';
  import type { Player } from '../lib/match';
  import { pairPlayers, shuffle } from '../lib/match';
  import * as XLSX from 'xlsx';
  import { savePlayersToStorage, loadPlayersFromStorage, savePairsToStorage, loadPairsFromStorage } from '../lib/storage';

  let textarea = '';
  let players: Player[] = [];
  let pairs: [Player, Player][] = [];
  let selected: Set<string> = new Set();
  // When showing bracket, precompute the first-round match pair labels for display
  let matchLabels: { a: string; b: string }[] = [];
  let bracket: any = null;
  // Bracket rendering is handled via manager/viewer now.

  // Brackets viewer integration (replacing bracketry)
  let viewerRendered = false;
  let showViewer = false;
  let viewerLoading = false;

  // Bracket rendering (now using bracketry)
  // (React removed)

  // Last rendered manager data (for re-renders)
  let lastManagerData: { stages: any[]; matches: any[]; matchGames: any[]; participants: any[] } | null = null;

  // Keep references to last manager and db so we can update matches (advance winners)
  let lastManagerInstance: any = null;
  let lastDbInstance: any = null;

  // Random stage saved state (created with "Crear cuadro aleatorio")
  let randomStageExists = false;
  let randomStageData: { stages: any[]; matches: any[]; matchGames: any[]; participants: any[] } | null = null;

  // Inputs for manual pair entry
  let pairAName = '';
  let pairBName = '';
  // Option for 'Completar hasta' (defaults to 64)
  let targetPairsOption: number = 64;

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

  function confirmClear() {
    // Ask for confirmation before clearing all data
    const ok = confirm('¿Estás seguro? Esto eliminará todos los jugadores y parejas.');
    if (!ok) return;
    players = [];
    pairs = [];
    selected.clear();
    textarea = '';
    bracket = null;
    savePlayersToStorage([]);
    savePairsToStorage([]);
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

  // Complete pairs up to a target number: only create the missing pairs and players if needed
  function completePairsTo(targetPairs: number = 64) {
    const targetPairsNum = Number(targetPairs) || 64;
    const pairsNeeded = targetPairsNum - pairs.length;
    if (pairsNeeded <= 0) return;

    const requiredPlayersCount = pairsNeeded * 2;

    // Determine currently unpaired players
    const usedIds = new Set<string>(pairs.flatMap((p) => [p[0].id, p[1].id]));
    const unpaired = players.filter((p) => !usedIds.has(p.id));

    const toUse: Player[] = [...unpaired];

    if (toUse.length < requiredPlayersCount) {
      // Create additional players to reach required count
      const neededNew = requiredPlayersCount - toUse.length;
      let maxId = players.reduce((m, x) => Math.max(m, Number(x.id)), 0);
      for (let i = 0; i < neededNew; i++) {
        maxId++;
        const p = { id: String(maxId), name: `Jugador ${maxId}` };
        players = [...players, p];
        toUse.push(p);
      }
      // Update textarea and storage for new players
      textarea = players.map((p) => p.name).join('\n');
      savePlayersToStorage(players);
    }

    const take = toUse.slice(0, requiredPlayersCount);
    const newPairs = pairPlayers(take);
    pairs = [...pairs, ...newPairs];
    selected.clear();
    bracket = null;
    savePairsToStorage(pairs.map((p) => ({ a: p[0].name, b: p[1].name })));
    console.log('Completed pairs up to', targetPairsNum, 'now total pairs:', pairs.length);
  }

  function generateBracket() {
    // Build a simple knockout bracket from pairs (preserves current order)
    const seeds = pairs.map((p) => ({ a: p[0].name, b: p[1].name }));
    bracket = buildBracketFromPairs(seeds);
  }

  // Toggle: create or delete a random stage (saved in localStorage)
  async function toggleRandomStage() {
    viewerLoading = true;
    try {
      if (!randomStageExists) {
        // create
        if (pairs.length < 2) {
          alert('Necesitas al menos 2 parejas para crear un cuadro aleatorio');
          console.warn('Skipping random stage creation: insufficient pairs', { pairsLength: pairs.length });
          return;
        }
        // Build seeding from *pairs* (show pair name + identifier) instead of flattening individual names
        const pairLabels = pairs.map((p, i) => `${p[0].name} / ${p[1].name} #${i + 1}`);
        const seeding = shuffle(pairLabels);
        // Ensure size is a power of two (manager may require it)
        const nextPow2 = (n: number) => { let p = 1; while (p < n) p <<= 1; return p; };
        const size = nextPow2(seeding.length);
        try {
          const { BracketsManager } = await import('@unitetheculture/brackets-manager');
          // Use local in-memory storage implementation
          const { default: InMemoryStorage } = await import('../lib/inMemoryStorage');
          const db = new InMemoryStorage();
          const manager = new BracketsManager(db as any);
          await manager.create({ tournamentId: 0, name: 'Stage', type: 'single_elimination', seeding, settings: { size } });
          if (size !== seeding.length) console.log('Adjusted stage size to next power of two', { requested: seeding.length, adjusted: size });

          const stages = db.data.stage || [];
          const matches = db.data.match || [];
          const participants = db.data.participant || [];
          const matchGames = db.data.match_game || [];

          randomStageData = { stages, matches, matchGames, participants };
          randomStageExists = true;
          localStorage.setItem('randomStageData', JSON.stringify(randomStageData));
          console.log('Random stage created and saved (in memory + localStorage)');
        } catch (e: any) {
          console.error('Could not create random stage', { message: e?.message || String(e), stack: e?.stack }, { seedingLength: seeding.length, seedingSample: seeding.slice(0,6), size });
          alert('Error al crear el cuadro aleatorio: ' + (e?.message || String(e)));
        }
      } else {
        // delete
        randomStageData = null;
        randomStageExists = false;
        localStorage.removeItem('randomStageData');
        // clear any rendered bracket
        const wrapper = document.getElementById('brackets-viewer-wrapper');
        if (wrapper) wrapper.innerHTML = '';
        console.log('Random stage deleted');
      }
    } finally {
      viewerLoading = false;
    }
  }

  // Render using brackets-manager -> fills an in-memory DB and renders viewer from it
  async function renderWithManager(type = 'single_elimination') {
    if (pairs.length === 0) {
      console.warn('No pairs to render with Manager');
      return;
    }

    viewerLoading = true;
    viewerRendered = true;
    showViewer = true;

    await tick();
    try {
      const { BracketsManager } = await import('@unitetheculture/brackets-manager');
      const { default: InMemoryStorage } = await import('../lib/inMemoryStorage');

      // Create DB and manager instances (local in-memory storage)
      let db = new InMemoryStorage();
      let manager = new BracketsManager(db as any);

      if (randomStageExists && randomStageData) {
        // hydrate DB with saved arrays
        db.data.stage = JSON.parse(JSON.stringify(randomStageData.stages || []));
        db.data.match = JSON.parse(JSON.stringify(randomStageData.matches || []));
        db.data.participant = JSON.parse(JSON.stringify(randomStageData.participants || []));
        db.data.match_game = JSON.parse(JSON.stringify(randomStageData.matchGames || []));
        lastDbInstance = db;
        lastManagerInstance = manager;
        console.log('Using saved random stage for rendering');
      } else {
        // Build seeding array from pairs (pair-level labels so the bracket shows pairs as single contestants)
        const pairLabels = pairs.map((p, i) => `${p[0].name} / ${p[1].name} #${i + 1}`);
        const seeding = pairLabels;
        // Ensure a power-of-two size for the manager (it may require it)
        const nextPow2 = (n: number) => { let p = 1; while (p < n) p <<= 1; return p; };
        const size = nextPow2(seeding.length);
        await manager.create({ tournamentId: 0, name: 'Stage', type, seeding, settings: { size } });
        if (size !== seeding.length) console.log('Adjusted stage size to next power of two', { requested: seeding.length, adjusted: size });

        // Now read raw data from the in-memory DB
        const stages = db.data.stage || [];
        const matches = db.data.match || [];
        const participants = db.data.participant || [];
        const matchGames = db.data.match_game || [];
        // Save instances for interactive updates (advance winners)
        lastDbInstance = db;
        lastManagerInstance = manager;

        console.log('Manager produced:', { stagesLength: stages.length, matchesLength: matches.length, participantsLength: participants.length });
        // If we just created a stage on the fly and user wants it persistent, do not automatically save it; use explicit toggleRandomStage
      }

      // Save manager-produced data for re-renders (compact toggle, window resize, etc.)
      const stages = db.data.stage || [];
      const matches = db.data.match || [];
      const participants = db.data.participant || [];
      const matchGames = db.data.match_game || [];

      lastManagerData = { stages, matches, matchGames, participants };
      // Prepare bracketry data and render using bracketry library
      const bracketryData = buildBracketryData(matches, participants);
      // compute first round match labels for display in the pairs panel
      try {
        matchLabels = (bracketryData.matches || []).filter((m: any) => m.roundIndex === 0).map((m: any) => ({ a: m.sides[0]?.title || '', b: m.sides[1]?.title || '' }));
      } catch (err) {
        matchLabels = [];
      }
      const wrapperEl = document.getElementById('brackets-viewer-wrapper');
      if (wrapperEl) {
        try {
          const { createBracket } = await import('bracketry');
          // clear wrapper and set full height to fill parent
          wrapperEl.innerHTML = '';
          wrapperEl.style.height = '100%';
          // expose global helper so bracketry callbacks can advance matches
          (window as any).__advanceMatch = (mid: number, side: number) => onParticipantClick(mid, side);
          createBracket(bracketryData, wrapperEl, { onMatchSideClick: (m: any, side: number) => { (window as any).__advanceMatch?.(m.matchId, side + 1); } });
          // legacy DOM attach for other viewers
          attachMatchClickHandlers();
        } catch (e) {
          console.error('Could not render bracketry', e);
          wrapperEl.innerHTML = '<pre>' + JSON.stringify(bracketryData, null, 2) + '</pre>';
        }
      }
      console.log('Brackets rendered from manager successfully');
      viewerRendered = true;
      showViewer = true;
    } catch (e) {
      console.error('renderWithManager failed', e);
    } finally {
      viewerLoading = false;
    }
  }

  // Helper: compute layout options based on container width and rounds
  function computeMatchLayoutOptions(matches: any[]) {
    const wrapper = document.getElementById('brackets-viewer-wrapper');
    const wrapperWidth = (wrapper && wrapper.clientWidth) ? wrapper.clientWidth : window.innerWidth;
    let roundsCount = 1;
    try {
      const set = new Set(matches.map((m) => (m && typeof m.round_id !== 'undefined') ? m.round_id : 0));
      roundsCount = Math.max(1, set.size);
    } catch (e) {
      roundsCount = 1;
    }
    // Layout widths for rounds
    const baseHorMargin = 8;
    const baseVerticalGap = 8;
    const maxDesired = 360; // allow wide rounds
    const reserved = (roundsCount + 1) * baseHorMargin * 2;
    const desired = Math.max(24, Math.floor((wrapperWidth - reserved) / roundsCount) - 8);
    const matchMaxWidth = Math.min(maxDesired, desired);
    console.log('computeMatchLayoutOptions', { wrapperWidth, roundsCount, matchMaxWidth, matchMinVerticalGap: baseVerticalGap, matchHorMargin: baseHorMargin });
    return { matchMaxWidth, matchMinVerticalGap: baseVerticalGap, matchHorMargin: baseHorMargin };
  }

  // Re-render the viewer using the lastManagerData (or provided data) with auto-fit layout
  async function renderManagerViewer(data?: any) {
    const d = data ?? lastManagerData;
    if (!d) {
      console.warn('No manager data to render');
      return;
    }
    const { stages, matches, matchGames, participants } = d;
    let wrapper = document.getElementById('brackets-viewer-wrapper');
    if (!wrapper) {
      console.warn('No #brackets-viewer-wrapper in DOM — creating fallback container');
      wrapper = document.createElement('div');
      wrapper.id = 'brackets-viewer-wrapper';
      wrapper.classList.add('brackets-viewer', 'mt-2', 'w-full', 'min-h-[240px]', 'overflow-x-auto');
      const main = document.querySelector('main') || document.body;
      main.appendChild(wrapper);
    }

    // prepare wrapper
    wrapper.innerHTML = '';
    wrapper.classList.add('brackets-viewer');
    wrapper.classList.add('compact');

    // Preferred renderer: bracketry
    try {
      const bracketData = buildBracketryData(matches, participants);
      // compute matchLabels for first round
      try {
        matchLabels = (bracketData.matches || []).filter((m: any) => m.roundIndex === 0).map((m: any) => ({ a: m.sides[0]?.title || '', b: m.sides[1]?.title || '' }));
      } catch (err) {
        matchLabels = [];
      }
      const wrapperEl = document.getElementById('brackets-viewer-wrapper');
      if (wrapperEl) {
        const { createBracket } = await import('bracketry');
        wrapperEl.innerHTML = '';
        wrapperEl.style.height = '100%';
        // expose global helper so bracketry callbacks can advance matches
        (window as any).__advanceMatch = (mid: number, side: number) => onParticipantClick(mid, side);
        createBracket(bracketData, wrapperEl, { onMatchSideClick: (m: any, side: number) => { (window as any).__advanceMatch?.(m.matchId, side + 1); } });
        // attach click handlers after rendering (DOM fallback)
        attachMatchClickHandlers();
      }
    } catch (e) {
      console.error('renderManagerViewer failed', e);
    }
  }

  // Attach click handlers on rendered match participants to advance winners
  function attachMatchClickHandlers() {
    if (!lastManagerData || !lastManagerInstance) return;
    const wrapper = document.getElementById('brackets-viewer-wrapper');
    if (!wrapper) return;
    // Remove previous listeners to avoid duplicates
    wrapper.querySelectorAll('.participant').forEach((el) => {
      el.replaceWith(el.cloneNode(true));
    });

    wrapper.querySelectorAll('[data-match-id]').forEach((matchEl) => {
      const matchId = Number(matchEl.getAttribute('data-match-id'));
      const participantsEls = matchEl.querySelectorAll('.participant');
      participantsEls.forEach((pEl, idx) => {
        pEl.addEventListener('click', async (ev) => {
          ev.stopPropagation();
          await onParticipantClick(matchId, idx + 1);
        });
      });
    });
  }



  // Called when user clicks participant: mark that participant as winner for the match
  async function onParticipantClick(matchId: number, participantSide: 1 | 2) {
    if (!lastManagerInstance || !lastDbInstance) {
      console.warn('Manager or DB not available for update');
      return;
    }
    try {
      console.log('User selected winner:', { matchId, participantSide });
      // Build payload: winner gets result 'win' and score 1, loser gets score 0
      const payload: any = { id: matchId };
      if (participantSide === 1) {
        payload.opponent1 = { score: 1, result: 'win' };
        payload.opponent2 = { score: 0 };
      } else {
        payload.opponent1 = { score: 0 };
        payload.opponent2 = { score: 1, result: 'win' };
      }
      // Use manager.update.match to apply the result and propagate to next rounds
      await lastManagerInstance.update.match(payload);

      // Read fresh data from DB and re-render
      const stages = lastDbInstance.data.stage || [];
      const matches = lastDbInstance.data.match || [];
      const participants = lastDbInstance.data.participant || [];
      const matchGames = lastDbInstance.data.match_game || [];
      lastManagerData = { stages, matches, matchGames, participants };
      // update viewer using bracketry
      await renderManagerViewer(lastManagerData);
      try {
        const bracketData = buildBracketryData(matches, participants);
        const wrapperEl = document.getElementById('brackets-viewer-wrapper');
        if (wrapperEl) {
          const { createBracket } = await import('bracketry');
          wrapperEl.innerHTML = '';
        wrapperEl.style.height = '100%';
        // expose global helper so bracketry callbacks can advance matches
        (window as any).__advanceMatch = (mid: number, side: number) => onParticipantClick(mid, side);
        createBracket(bracketData, wrapperEl, { onMatchSideClick: (m: any, side: number) => { (window as any).__advanceMatch?.(m.matchId, side + 1); } });
          // re-attach click handlers for newly rendered content
          attachMatchClickHandlers();
        }
      } catch (e) {
        console.error('Could not re-render bracketry after match update', e);
      }
      console.log('Match updated and viewer re-rendered for match', matchId);
    } catch (e) {
      console.error('Could not update match', e);
    }
  }

// renderWithManagerD3 removed — rendering now uses bracketry directly.

  // Toggle showing the bracket (using bracketry)

  async function toggleShowBracket() {
    // If already rendered, unmount and hide
    const existingWrapper = document.getElementById('brackets-viewer-wrapper');
    if (existingWrapper && existingWrapper.innerHTML.trim()) {
      existingWrapper.classList.remove('compact');
      existingWrapper.innerHTML = '';
      showViewer = false;
      viewerRendered = false;
      matchLabels = [];
      return;
    }

    // Build bracketry data either from saved random stage or from current pairs
    let data: any;

    if (randomStageExists && randomStageData) {
      const matches = randomStageData.matches || [];
      const participants = randomStageData.participants || [];
      data = buildBracketryData(matches, participants);
    } else {
      if (pairs.length === 0) {
        alert('No hay cuadro creado y no hay parejas. Pulsa "Crear cuadro aleatorio" o añade parejas primero.');
        return;
      }

      // Build an in-memory stage from current pairs so user can view a bracket without saving it
      try {
        // Use pair labels (name + index) so ephemeral stage shows pairs as contestants
        const pairLabels = pairs.map((p, i) => `${p[0].name} / ${p[1].name} #${i + 1}`);
        const seeding = pairLabels;
        const nextPow2 = (n: number) => { let p = 1; while (p < n) p <<= 1; return p; };
        const size = nextPow2(seeding.length);
        const { BracketsManager } = await import('@unitetheculture/brackets-manager');
        const { default: InMemoryStorage } = await import('../lib/inMemoryStorage');
        const db = new InMemoryStorage();
        const manager = new BracketsManager(db as any);
        await manager.create({ tournamentId: 0, name: 'Stage', type: 'single_elimination', seeding, settings: { size } });
        if (size !== seeding.length) console.log('Adjusted ephemeral stage size to next power of two', { requested: seeding.length, adjusted: size });

        const matches = db.data.match || [];
        const participants = db.data.participant || [];
        const matchGames = db.data.match_game || [];

        // keep instances so clicks can advance winners even for ephemeral stage
        lastDbInstance = db;
        lastManagerInstance = manager;
        lastManagerData = { stages: db.data.stage || [], matches, matchGames, participants };

        data = buildBracketryData(matches, participants);
      } catch (e) {
        console.error('Could not build stage from pairs', e);
        alert('Error al generar el cuadro desde las parejas.');
        return;
      }
    }

    // compute matchLabels for first round so they can be shown in the pairs panel
    try {
      matchLabels = (data.matches || []).filter((m: any) => m.roundIndex === 0).map((m: any) => ({ a: m.sides[0]?.title || '', b: m.sides[1]?.title || '' }));
    } catch (err) {
      matchLabels = [];
    }

    // Show wrapper and render via bracketry
    showViewer = true;
    viewerRendered = true;
    await tick();
    const wrapper = document.getElementById('brackets-viewer-wrapper');
    if (!wrapper) {
      console.warn('No #brackets-viewer-wrapper found');
      return;
    }
    wrapper.innerHTML = '';
    wrapper.classList.add('compact');
    wrapper.style.height = '100%';
    try {
      const { createBracket } = await import('bracketry');
      // expose global helper so bracketry callbacks can advance matches
      (window as any).__advanceMatch = (mid: number, side: number) => onParticipantClick(mid, side);
      createBracket(data, wrapper, { onMatchSideClick: (m: any, side: number) => { (window as any).__advanceMatch?.(m.matchId, side + 1); } });
      // attach click handlers to allow advancing winners (fallback)
      attachMatchClickHandlers();
    } catch (e) {
      console.error('Could not render bracketry in toggleShowBracket', e);
      wrapper.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
    }
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

  // Convert manager matches + participants into bracketry data shape
  // (moved to src/lib/bracketryUtils.ts)
  import { buildBracketryData as _buildBracketryData } from '../lib/bracketryUtils';
  const buildBracketryData = _buildBracketryData;

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

    // Load previously saved random stage (if any)
    try {
      const raw = localStorage.getItem('randomStageData');
      if (raw) {
        randomStageData = JSON.parse(raw);
        randomStageExists = !!randomStageData;
      }
    } catch (e) {
      console.warn('Could not load saved random stage', e);
    }

  });

  onDestroy(() => {
    // no-op (react mount removed)
  });
</script>

<div class="space-y-4">
  <div class="flex flex-wrap gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
    
    <div class="flex flex-wrap gap-2">
      <button class="btn btn-sky" on:click={importPlayers}>Importar Jugadores</button>
      <button class="btn btn-white" on:click={confirmClear}>Limpiar Todo</button>
    </div>

    <div class="flex items-center gap-2 bg-white p-1 border rounded-md shadow-sm">
      <span class="text-xs font-semibold px-2 text-gray-500 uppercase">Completar hasta:</span>
      <select bind:value={targetPairsOption} class="bg-transparent text-sm font-medium focus:outline-none">
        <option value="16">16</option>
        <option value="32">32</option>
        <option value="64">64</option>
        <option value="128">128</option>
      </select>
      <button class="btn btn-indigo py-1 px-3 text-sm" on:click={() => completePairsTo(targetPairsOption)}>
        Ejecutar
      </button>
    </div>

    <div class="flex flex-wrap gap-2">
      <button class="btn btn-amber" on:click={toggleRandomStage} disabled={viewerLoading}>
        {randomStageExists ? 'Borrar Cuadro' : 'Crear Cuadro Aleatorio'}
      </button>
      
      {#if randomStageExists || pairs.length > 0}
        <button class="btn btn-purple" on:click={() => toggleShowBracket()}>
          {showViewer ? 'Ocultar Cuadro' : 'Mostrar Cuadro'}
        </button>
      {/if}
    </div>

    <div class="flex gap-2">
      <button class="btn btn-gray text-xs" on:click={exportExcel}>Excel</button>
      <button class="btn btn-gray text-xs" on:click={exportCSV}>CSV</button>
    </div>
  </div>

  <div class="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
    <h3 class="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Añadir Pareja Manual</h3>
    <div class="flex flex-wrap gap-2 items-end">
      <div class="flex flex-col gap-1">
        <label for="pair-a" class="text-xs text-gray-500 ml-1">Jugador A</label>
        <input id="pair-a" class="input-field" placeholder="Nombre..." bind:value={pairAName} />
      </div>
      <div class="flex flex-col gap-1">
        <label for="pair-b" class="text-xs text-gray-500 ml-1">Jugador B</label>
        <input id="pair-b" class="input-field" placeholder="Nombre..." bind:value={pairBName} />
      </div>
      <button 
        type="button" 
        class="btn btn-green h-[36px] px-4 disabled:bg-gray-300" 
        on:click={addPairByNames} 
        disabled={!(pairAName.trim() && pairBName.trim())}
      >
        Añadir Pareja
      </button>
    </div>
  </div>

  <div class="flex flex-col lg:flex-row">
    <div class="flex-1">
      <PlayerPairCard {pairs} matchLabels={matchLabels} viewOnly={showViewer} on:removePair={(e) => removePair(e.detail)} on:updatePair={(e) => updatePair(e.detail)} />

    </div>
    {#if showViewer}
      <div class="w-full lg:w-2/5 min-h-[220px] bg-gray-50 overflow-hidden sticky p-0 m-0">
        <BracketsViewer />
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  /* Clases de utilidad para mantener coherencia */
  .btn {
    @apply px-4 py-1 rounded-md font-medium transition-all active:scale-95 shadow-sm text-sm whitespace-nowrap;
  }
  .btn-sky { @apply bg-sky-600 text-white hover:bg-sky-700; }
  .btn-indigo { @apply bg-indigo-600 text-white hover:bg-indigo-700; }
  .btn-white { @apply bg-white border border-gray-300 text-gray-700 hover:bg-gray-50; }
  .btn-amber { @apply bg-amber-500 text-white hover:bg-amber-600; }
  .btn-purple { @apply bg-purple-600 text-white hover:bg-purple-700; }
  .btn-gray { @apply bg-gray-200 text-gray-700 hover:bg-gray-300; }
  .btn-green { @apply bg-green-600 text-white hover:bg-green-700; }
  
  .input-field {
    @apply border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all w-full sm:w-48;
  }
</style>
