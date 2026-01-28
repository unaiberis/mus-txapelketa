<script lang="ts">
  import { onMount, tick, onDestroy } from 'svelte';
  import PlayerPairCard from './PlayerPairCard.svelte';
  import BracketsViewer from './BracketsViewer.svelte';
  import type { Player } from '../lib/match';
  import { pairPlayers, shuffle } from '../lib/match';
  import * as XLSX from 'xlsx';
  import { buildBracketryData } from '../lib/bracketryUtils';
  import { savePlayersToStorage, loadPlayersFromStorage, savePairsToStorage, loadPairsFromStorage } from '../lib/storage';
  import { lang, t, languages } from '../lib/i18n';
  import type { StageType } from 'brackets-model';
  import { get } from 'svelte/store';

  let textarea = '';
  let players: Player[] = [];
  let pairs: [Player, Player][] = [];
  let selected: Set<string> = new Set();
  // When true the pairs panel is shown. Set to false when clearing all to remove the Pairs div completely.
  let showPairs = true;
  // When false, all bracket/viewer related UI and actions are disabled (used on homepage)
  export let allowViewer: boolean = true; 

  // Basque given names split by gender (supplied)
  const BASQUE_GIVENS = {
    masc: [
      'Adur', 'Aimar', 'Aitor', 'Ametz', 'Ander', 'Antton', 'Aratz', 'Asier', 'Beñat', 'Bittor',
      'Egoi', 'Ekaitz', 'Ekhi', 'Enaitz', 'Eneko', 'Endika', 'Eñaut', 'Gaizka', 'Gorka', 'Hodei',
      'Ibai', 'Iban', 'Igor', 'Iker', 'Imanol', 'Iñaki', 'Iñigo', 'Ipar', 'Iraitz', 'Iurgi',
      'Izani', 'Jabi', 'Jakes', 'Joanes', 'Jokin', 'Jon', 'Josu', 'Julen', 'Kepa', 'Lander',
      'Luken', 'Markel', 'Mattin', 'Mikel', 'Oihan', 'Oier', 'Orhi', 'Ortzi', 'Patxi', 'Peio',
      'Unai', 'Unax', 'Urko', 'Xabier', 'Zigor'
    ],
    fem: [
      'Aia', 'Ainhoa', 'Ainara', 'Aintzane', 'Aizpea', 'Alaia', 'Alaitz', 'Alazne', 'Amagoia', 'Amaia',
      'Ane', 'Araitz', 'Arantxa', 'Arene', 'Argi', 'Eba', 'Edurne', 'Eider', 'Ekiñe', 'Elaia',
      'Elori', 'Enara', 'Estibaliz', 'Garazi', 'Garbiñe', 'Goizane', 'Haizea', 'Idoia', 'Irati', 'Iraia',
      'Iratxe', 'Irune', 'Itsaso', 'Itziar', 'Izaro', 'Izaskun', 'Jone', 'Larraitz', 'Leire', 'Lide',
      'Lorea', 'Maddi', 'Maialen', 'Maitane', 'Maite', 'Malen', 'Miren', 'Nagore', 'Naia', 'Naiara',
      'Naroa', 'Nekane', 'Nerea', 'Oihana', 'Olatz', 'Onintza', 'Udane', 'Uxue', 'Zuriñe'
    ]
  };

  // Basque surnames supplied (extended list)
  const BASQUE_SURNAMES = [
    'Abaitua', 'Agirre', 'Aizpurua', 'Alberdi', 'Alkorta', 'Altuna', 'Amundarain', 'Anitua', 'Ansotegi',
    'Arana', 'Aranguren', 'Aranzabal', 'Areitio', 'Aretxabaleta', 'Aristi', 'Aristizabal', 'Armendariz',
    'Arregi', 'Arrieta', 'Arrizabalaga', 'Arruabarrena', 'Artetxe', 'Azkarate', 'Azkue', 'Azurmendi',
    'Barandiaran', 'Barrenetxea', 'Basagoiti', 'Bengoa', 'Bengoetxea', 'Berasategi', 'Bilbao', 'Bolibar',
    'Echevarría', 'Elorriaga', 'Elorza', 'Elustondo', 'Erreka', 'Eskibel', 'Etxeberria', 'Gabiria',
    'Gabilondo', 'Galarza', 'Galdos', 'Garate', 'Garmendia', 'Gaztelu', 'Goikoetxea', 'Gurrutxaga',
    'Ibarra', 'Ibarretxe', 'Idigoras', 'Igartua', 'Iraola', 'Iriondo', 'Irusta', 'Iturbe', 'Iturriaga',
    'Izagirre', 'Laka', 'Landa', 'Larrañaga', 'Larrinaga', 'Lazkano', 'Legarreta', 'Lertxundi', 'Loyola',
    'Madariaga', 'Maguregi', 'Maiz', 'Mendieta', 'Mendizabal', 'Muguruza', 'Munitiz', 'Murua', 'Ochoa',
    'Olabarria', 'Olarte', 'Olaizola', 'Ondarra', 'Orbegozo', 'Ordorika', 'Ormaetxea', 'Orozko', 'Osa',
    'Otegi', 'Otxoa', 'Pagadi', 'Pagaldai', 'Retegi', 'Sagasti', 'Salaberria', 'Sarasola', 'Soraluze',
    'Tellechea', 'Unamuno', 'Urbina', 'Uriarte', 'Uribarri', 'Uribe', 'Urkizu', 'Urkullu', 'Urrutia',
    'Urrutikoetxea', 'Zabala', 'Zabaleta', 'Zaldibar', 'Zearra', 'Zelaia', 'Zubiria', 'Zubizarreta', 'Zuloaga'
  ];

  // Merge masc + fem givens for generation
  const BASQUE_GIVENS_MERGED = [...BASQUE_GIVENS.masc, ...BASQUE_GIVENS.fem];

  // Precompute up to 256 unique full names by combining givens and surnames
  const BASQUE_NAMES: string[] = (() => {
    const out: string[] = [];
    for (const s of BASQUE_SURNAMES) {
      for (const g of BASQUE_GIVENS_MERGED) {
        out.push(`${g} ${s}`);
        if (out.length === 256) break;
      }
      if (out.length === 256) break;
    }
    // Fill any remaining slots with indexed names if needed
    let i = 1;
    while (out.length < 256) {
      out.push(`Jugador ${i}`);
      i++;
    }
    // Shuffle names to avoid grouping by surname (distribute surnames across the list)
    return shuffle(out);
  })();

  // Pick a random combination of given + surname, avoid collisions with usedNames
  function pickBasqueName(usedNames: Set<string>) : string | null {
    const givens = BASQUE_GIVENS_MERGED;
    const surnames = BASQUE_SURNAMES;
    if (!givens.length || !surnames.length) return null;
    const maxAttempts = givens.length * surnames.length;
    for (let i = 0; i < maxAttempts; i++) {
      const g = givens[Math.floor(Math.random() * givens.length)];
      const s = surnames[Math.floor(Math.random() * surnames.length)];
      const name = `${g} ${s}`;
      if (!usedNames.has(name)) return name;
    }
    return null;
  }

  // Helper: generate N unique random Basque names
  function generateRandomNames(count: number) {
    const out: string[] = [];
    const used = new Set<string>();
    for (let i = 0; i < count; i++) {
      const n = pickBasqueName(used) || `Jugador ${i + 1}`;
      used.add(n);
      out.push(n);
    }
    return out;
  }

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
    // ensure the pairs panel is visible when new pairs are created
    showPairs = true;
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
    // make sure pairs panel is visible after adding
    showPairs = true;
    pairAName = '';
    pairBName = '';
    savePairsToStorage(pairs.map((p) => ({ a: p[0].name, b: p[1].name })) );
  }

  function removePair(index: number) {
    pairs = pairs.filter((_, i) => i !== index);
    savePairsToStorage(pairs.map((p) => ({ a: p[0].name, b: p[1].name })));
  }

  function confirmClear() {
    // Ask for confirmation before clearing all data
    const ok = confirm(get(t)('confirmClear'));
    if (!ok) return;
    players = [];
    pairs = [];
    // hide the pairs panel entirely when everything is cleared
    showPairs = false;
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
    // ensure pairs panel becomes visible
    showPairs = true;
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
      const used = new Set(players.map((p) => p.name));
      for (let i = 0; i < neededNew; i++) {
        maxId++;
        // Try to assign an unused Basque name; fallback to generic label if exhausted
        const name = pickBasqueName(used) || `Jugador ${maxId}`;
        used.add(name);
        const p = { id: String(maxId), name };
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
    // make sure pairs panel is visible after auto-complete
    showPairs = true;
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
    if (!allowViewer) {
      console.warn('Viewer disabled here - toggleRandomStage aborted');
      return;
    }
    // When creating a random stage, confirm that editing will be blocked
    viewerLoading = true;
    try {
      if (!randomStageExists) {
        // need at least 2 pairs
        if (pairs.length < 2) {
          alert('Necesitas al menos 2 parejas para crear un cuadro aleatorio');
          console.warn('Skipping random stage creation: insufficient pairs', { pairsLength: pairs.length });
          return;
        }
        const confirmMsg = 'Al mostrar el cuadro se bloqueará la edición de parejas. ¿Deseas continuar?';
        const ok = confirm(confirmMsg);
        if (!ok) return;

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

          // render and show the bracket immediately (locks editing via showViewer in renderWithManager)
          await renderWithManager();
        } catch (e: any) {
          console.error('Could not create random stage', { message: e?.message || String(e), stack: e?.stack }, { seedingLength: seeding.length, seedingSample: seeding.slice(0,6), size });
          alert('Error al crear el cuadro aleatorio: ' + (e?.message || String(e)));
        }
      } else {
        // confirm deletion
        const okDel = confirm(get(t)('deleteConfirm'));
        if (!okDel) return;

        // delete
        randomStageData = null;
        randomStageExists = false;
        localStorage.removeItem('randomStageData');
        // clear any rendered bracket
        const wrapper = document.getElementById('brackets-viewer-wrapper');
        if (wrapper) wrapper.innerHTML = '';
        // hide viewer and re-enable editing
        showViewer = false;
        viewerRendered = false;
        console.log('Random stage deleted');
      }
    } finally {
      viewerLoading = false;
    }
  }

  // Render using brackets-manager -> fills an in-memory DB and renders viewer from it
  async function renderWithManager(type: StageType = 'single_elimination') {
    if (!allowViewer) {
      console.warn('Viewer disabled here - renderWithManager aborted');
      return;
    }
    // Allow rendering if we have a saved random stage even when pairs are empty
    if (pairs.length === 0 && !(randomStageExists && randomStageData)) {
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
      // Expose a simple helper for debugging & manual re-render of saved stage
      (window as any).__renderSavedStage = async () => {
        try {
          await renderWithManager();
          console.log('Manual re-render of saved stage performed');
        } catch (err) {
          console.error('Manual re-render failed', err);
        }
      };
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
          // clear wrapper and set full height to fill parent
          wrapperEl.innerHTML = '';
          wrapperEl.style.height = '100%';
          const ok = await safeCreateBracket(bracketryData, wrapperEl);
          if (ok) {
            // legacy DOM attach for other viewers
            attachMatchClickHandlers();
            // localize default round labels generated by bracketry (Round N -> Txanda N)
            localizeRoundLabels();
          } else {
            console.warn('Bracket rendering failed and fallback content was shown');
          }
        } catch (e: any) {
          console.error('Could not render bracketry', e, e?.stack);
          try { (window as any).__lastRenderError = { message: e?.message || String(e), stack: e?.stack || null }; } catch (_err) {}
          try {
            wrapperEl.innerHTML = '<div class="render-error p-2 rounded bg-red-50 border border-red-200"><strong>Error rendering bracket:</strong><div style="white-space:pre-wrap;margin-top:8px;">' + (e?.message || String(e)) + '</div><hr style="margin:8px 0;"/><pre>' + JSON.stringify(bracketryData, null, 2) + '</pre><div style="margin-top:8px;font-size:0.8rem;color:#666">Tip: puedes volver a intentar con <code>window.__renderSavedStage()</code></div></div>';
          } catch (inner) {
            wrapperEl.innerHTML = '<pre>' + JSON.stringify(bracketryData, null, 2) + '</pre>';
          }
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
        wrapperEl.innerHTML = '';
        wrapperEl.style.height = '100%';
        const ok = await safeCreateBracket(bracketData, wrapperEl);
        if (ok) {
          // attach click handlers after rendering (DOM fallback)
          attachMatchClickHandlers();
          // localize round labels to Basque
          localizeRoundLabels();
          // localize round labels to Basque
          localizeRoundLabels();
        } else {
          console.warn('Bracket rendering failed and fallback content was shown');
        }
      }
    } catch (e) {
      console.error('renderManagerViewer failed', e);
    }
  }

  // Localize round labels (replace English 'Round N' with Basque 'Txanda N')
  function localizeRoundLabels() {
    const wrapper = document.getElementById('brackets-viewer-wrapper') || document.querySelector('.bracket-viewport');
    if (!wrapper) return;
    // Replace text nodes that are plain 'Round N' — operate on HTMLElements so TypeScript knows about textContent
    wrapper.querySelectorAll('*').forEach((el) => {
      const node = el as HTMLElement;
      if (node.children.length === 0 && typeof node.textContent === 'string') {
        const txt = node.textContent.trim();
        const m = txt.match(/^Round\s*(\d+)/i);
        if (m) node.textContent = get(t)('round_label', { n: m[1] });
      }
    });
    // Also handle elements that contain 'Round' as part of their text
    wrapper.querySelectorAll('.round-label, .round-title').forEach((el) => {
      const node = el as HTMLElement;
      node.textContent = (node.textContent || '').replace(/Round\s*(\d+)/i, (_all: string, n: string) => get(t)('round_label', { n }));
    });
  }

  // Safe wrapper around bracketry.createBracket that logs full errors and returns boolean success
  async function safeCreateBracket(bracketData: any, wrapperEl: HTMLElement) {
    try {
      const { createBracket } = await import('bracketry');
      // expose global helper so bracketry callbacks can advance matches
      // __advanceMatch accepts numeric side and will cast to 1|2 when invoking onParticipantClick
      (window as any).__advanceMatch = (mid: number, side: number) => onParticipantClick(mid, side as 1 | 2);
      createBracket(bracketData, wrapperEl, { onMatchSideClick: (m: any, side: number) => { (window as any).__advanceMatch?.(m.matchId, side + 1); } });
      return true;
    } catch (e: any) {
      console.error('safeCreateBracket failed', e, e?.stack);
      // expose error for debugging in the page context
      try { (window as any).__lastBracketError = e; (window as any).__lastBracketStack = e?.stack || null; } catch (err) {}
      // Show useful error message in the wrapper to help debugging but keep it styled
      try {
        wrapperEl.innerHTML = '<div class="render-error p-2 rounded bg-red-50 border border-red-200"><strong>Error rendering bracket:</strong><div style="white-space:pre-wrap;margin-top:8px;">' + (e?.message || String(e)) + '</div><hr style="margin:8px 0;"/><pre>' + JSON.stringify(bracketData, null, 2) + '</pre><div style="margin-top:8px;font-size:0.8rem;color:#666">Tip: puedes volver a intentar con <code>window.__renderSavedStage()</code></div></div>';
      } catch (inner) {
        wrapperEl.innerHTML = '<pre>' + JSON.stringify(bracketData, null, 2) + '</pre>';
      }
      return false;
    }
  }

  // Mesa badge positioning removed (feature disabled).

  // Mesa badges removed — disabled because of layout issues across viewports.

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
          // idx will be 0 or 1; cast to the expected literal type 1 | 2
          await onParticipantClick(matchId, (idx + 1) as 1 | 2);
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
          wrapperEl.innerHTML = '';
          wrapperEl.style.height = '100%';
          const ok = await safeCreateBracket(bracketData, wrapperEl);
          if (ok) {
            // re-attach click handlers for newly rendered content
            attachMatchClickHandlers();
          } else {
            console.warn('Bracket re-render failed and fallback content was shown');
          }
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
        alert(get(t)('noBracketAndPairs'));
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
      const ok = await safeCreateBracket(data, wrapper);
      if (ok) {
        // translate the default round labels into Basque
        localizeRoundLabels();
        // attach click handlers to allow advancing winners (fallback)
        attachMatchClickHandlers();
      } else {
        console.warn('Bracket render in toggleShowBracket failed and fallback content was shown');
      }
    } catch (e: any) {
      console.error('Could not render bracketry in toggleShowBracket', e, e?.stack);
      try { (window as any).__lastRenderError = { message: e?.message || String(e), stack: e?.stack || null }; } catch (_err) {}
      try {
        wrapper.innerHTML = '<div class="render-error p-2 rounded bg-red-50 border border-red-200"><strong>Error rendering bracket:</strong><div style="white-space:pre-wrap;margin-top:8px;">' + (e?.message || String(e)) + '</div><hr style="margin:8px 0;"/><pre>' + JSON.stringify(data, null, 2) + '</pre><div style="margin-top:8px;font-size:0.8rem;color:#666">Tip: puedes volver a intentar con <code>window.__renderSavedStage()</code></div></div>';
      } catch (inner) {
        wrapper.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
      }
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
  // (moved to src/lib/bracketryUtils.ts) — using top-level import above


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
  onMount(async () => {
    console.log('Players component hydrated on client (onMount)');
    const stored = loadPlayersFromStorage();
    if (stored && stored.length) {
      players = stored;
      // Migrate any generic "Jugador N" names to Basque names if available
      const used = new Set(players.map((p) => p.name));
      players = players.map((p) => {
        if (/^Jugador\s*\d+$/i.test(p.name)) {
          const replacement = pickBasqueName(used);
          if (replacement) {
            used.add(replacement);
            return { ...p, name: replacement };
          }
        }
        return p;
      });
      textarea = players.map((p) => p.name).join('\n');
      savePlayersToStorage(players);
    } else {
      textarea = generateRandomNames(8).join('\n');
      importPlayers();
    }

    // Load pairs from storage (if any)
    const storedPairs = loadPairsFromStorage();
    if (storedPairs && storedPairs.length) {
      // Ensure players list includes any names from pairs and migrate generic 'Jugador N' entries
      const used = new Set(players.map((p) => p.name));
      for (const sp of storedPairs) {
        // For a
        let nameA = sp.a;
        if (/^Jugador\s*\d+$/i.test(sp.a)) {
          const repl = pickBasqueName(used);
          if (repl) { nameA = repl; used.add(repl); }
        }
        if (!players.find((p) => p.name === nameA)) {
          const maxId = players.reduce((m, x) => Math.max(m, Number(x.id)), 0);
          players = [...players, { id: String(maxId + 1), name: nameA }];
        }

        // For b
        let nameB = sp.b;
        if (/^Jugador\s*\d+$/i.test(sp.b)) {
          const repl = pickBasqueName(used);
          if (repl) { nameB = repl; used.add(repl); }
        }
        if (!players.find((p) => p.name === nameB)) {
          const maxId = players.reduce((m, x) => Math.max(m, Number(x.id)), 0);
          players = [...players, { id: String(maxId + 1), name: nameB }];
        }
      }
      // Persist any changes to players (migrations or additions)
      savePlayersToStorage(players);

      // Map names to player objects
      pairs = storedPairs.map((sp) => {
        const aName = /^Jugador\s*\d+$/i.test(sp.a) ? players.find((p) => p.name !== undefined && p.name === sp.a) ? sp.a : players.find((p) => p.name !== undefined && p.name.startsWith(sp.a.split(' ')[0]))!.name : sp.a;
        // Use the possibly migrated names instead of raw stored pair names
        const a = players.find((p) => p.name === (aName as string))!;
        const bName = /^Jugador\s*\d+$/i.test(sp.b) ? players.find((p) => p.name !== undefined && p.name === sp.b) ? sp.b : players.find((p) => p.name !== undefined && p.name.startsWith(sp.b.split(' ')[0]))!.name : sp.b;
        const b = players.find((p) => p.name === (bName as string))!;
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

    // If a random stage was previously saved, render it immediately so it survives refresh
    if (allowViewer && randomStageExists && randomStageData) {
      try {
        await renderWithManager();
      } catch (e) {
        console.error('Could not auto-render saved random stage on mount', e);
      }
    }

  });

  onDestroy(() => {
    // no-op (react mount removed)
  });
</script>

<div class="space-y-4">
  <!-- Toolbar moved to header; controls are now present in the site header to avoid duplication -->

  <div class="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
    <h3 class="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">{$t('addPair')}</h3>
    <div class="flex flex-wrap gap-2 items-end">
      <div class="flex flex-col gap-1">
        <label for="pair-a" class="text-xs text-gray-500 ml-1">{$t('playerA')}</label>
        <input id="pair-a" class="input-field" placeholder="Nombre..." bind:value={pairAName} disabled={randomStageExists || showViewer} aria-label={$t('playerA')} />
      </div>
      <div class="flex flex-col gap-1">
        <label for="pair-b" class="text-xs text-gray-500 ml-1">{$t('playerB')}</label>
        <input id="pair-b" class="input-field" placeholder="Nombre..." bind:value={pairBName} disabled={randomStageExists || showViewer} aria-label={$t('playerB')} />
      </div>
      <button 
        type="button" 
        class="btn btn-green h-[36px] px-4 disabled:bg-gray-300" 
        on:click={addPairByNames} 
        disabled={!(pairAName.trim() && pairBName.trim()) || randomStageExists || showViewer}
      >
        {$t('addPair')}
      </button>
    </div>
  </div>

  <div class="flex flex-col lg:flex-row">
    <div class="flex-1">
      {#if showPairs}
        <PlayerPairCard {pairs} matchLabels={matchLabels} viewOnly={showViewer} on:removePair={(e) => removePair(e.detail)} on:updatePair={(e) => updatePair(e.detail)} />
      {/if}

    </div>
    {#if allowViewer && showViewer}
      <div class="w-full lg:w-2/5 min-h-[120px] bg-gray-50 overflow-hidden sticky p-0 m-0">
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
  .btn-red { @apply bg-red-600 text-white hover:bg-red-700; }
  .btn-purple { @apply bg-purple-600 text-white hover:bg-purple-700; }
  .btn-gray { @apply bg-gray-200 text-gray-700 hover:bg-gray-300; }
  .btn-green { @apply bg-green-600 text-white hover:bg-green-700; }
  
  .input-field {
    @apply border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all w-full sm:w-48;
  }

</style>
