<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { buildBracketryData } from '../lib/bracketryUtils';

  let wrapperEl: HTMLElement | null = null;
  let lastManagerInstance: any = null;
  let lastDbInstance: any = null;
  let lastManagerData: any = null;

  async function safeCreateBracket(bracketData: any, wrapper: HTMLElement) {
    try {
      const { createBracket } = await import('bracketry');
      (window as any).__advanceMatch = (mid: number, side: number) => onParticipantClick(mid, side as 1 | 2);
      createBracket(bracketData, wrapper, { onMatchSideClick: (m: any, side: number) => { (window as any).__advanceMatch?.(m.matchId, side + 1); } });
      return true;
    } catch (e) {
      console.error('safeCreateBracket failed', e);
      try { wrapper.innerHTML = '<div class="render-error p-2 rounded bg-red-50 border border-red-200"><strong>Error rendering bracket:</strong> ' + ((e as any)?.message || String(e)) + '</div>'; } catch (err) { wrapper.textContent = JSON.stringify(bracketData); }
      return false;
    }
  }

  function attachMatchClickHandlers() {
    if (!lastManagerInstance || !lastDbInstance) return;
    if (!wrapperEl) return;
    // Re-attach event handlers by replacing nodes (clears old listeners)
    wrapperEl!.querySelectorAll('.participant').forEach((el) => el.replaceWith(el.cloneNode(true)));

    // Apply handlers and visual states based on lastDbInstance matches
    const matchesData = (lastDbInstance && lastDbInstance.data && lastDbInstance.data.match) ? lastDbInstance.data.match : [];

    wrapperEl!.querySelectorAll('[data-match-id]').forEach((matchEl) => {
      const matchId = Number((matchEl as HTMLElement).getAttribute('data-match-id'));
      const participantsEls = Array.from((matchEl as HTMLElement).querySelectorAll('.participant')) as HTMLElement[];

      // Add click handlers
      participantsEls.forEach((pEl, idx) => {
        // make accessible/focusable
        try { pEl.tabIndex = 0; pEl.setAttribute('role', 'button'); } catch (e) {}

        pEl.addEventListener('click', async (ev) => {
          ev.stopPropagation();
          await onParticipantClick(matchId, (idx + 1) as 1 | 2);
        });

        pEl.addEventListener('keydown', async (ev: KeyboardEvent) => {
          const key = ev.key;
          if (key === 'Enter' || key === ' ') {
            ev.preventDefault();
            await onParticipantClick(matchId, (idx + 1) as 1 | 2);
            return;
          }
          if (key === 'ArrowRight' || key === 'ArrowDown') {
            ev.preventDefault();
            focusNextParticipant(pEl, 1);
            return;
          }
          if (key === 'ArrowLeft' || key === 'ArrowUp') {
            ev.preventDefault();
            focusNextParticipant(pEl, -1);
            return;
          }
        });
      });

      // Apply winner/loser classes from stored match data
      const matchDatum = matchesData.find((m: any) => Number(m.matchId) === matchId || Number(m.id) === matchId || Number(m.match_id) === matchId);
      if (matchDatum) {
        // Clear existing classes
        participantsEls.forEach((p) => { p.classList.remove('winner', 'loser'); p.classList.remove('pulse'); });
        try {
          const op1 = matchDatum.opponent1 || matchDatum.opponent_1 || matchDatum.opponentA || matchDatum.opponentA || {};
          const op2 = matchDatum.opponent2 || matchDatum.opponent_2 || matchDatum.opponentB || matchDatum.opponentB || {};
          if (op1 && op1.result === 'win') {
            if (participantsEls[0]) { participantsEls[0].classList.add('winner', 'pulse'); setTimeout(() => participantsEls[0]?.classList.remove('pulse'), 800); }
            if (participantsEls[1]) { participantsEls[1].classList.add('loser'); }
          } else if (op2 && op2.result === 'win') {
            if (participantsEls[1]) { participantsEls[1].classList.add('winner', 'pulse'); setTimeout(() => participantsEls[1]?.classList.remove('pulse'), 800); }
            if (participantsEls[0]) { participantsEls[0].classList.add('loser'); }
          } else if (typeof op1.score === 'number' && typeof op2.score === 'number') {
            // Compare numeric scores
            if (op1.score > op2.score) { if (participantsEls[0]) { participantsEls[0].classList.add('winner', 'pulse'); setTimeout(() => participantsEls[0]?.classList.remove('pulse'), 800);} if (participantsEls[1]) participantsEls[1].classList.add('loser'); }
            else if (op2.score > op1.score) { if (participantsEls[1]) { participantsEls[1].classList.add('winner', 'pulse'); setTimeout(() => participantsEls[1]?.classList.remove('pulse'), 800);} if (participantsEls[0]) participantsEls[0].classList.add('loser'); }
          }
          // Update or insert score badges for participants
          try {
            const scoreA = (typeof op1.score === 'number') ? op1.score : null;
            const scoreB = (typeof op2.score === 'number') ? op2.score : null;
            const scores = [scoreA, scoreB];
            participantsEls.forEach((pEl, idx) => {
              // find existing badge
              let badge = pEl.querySelector('.score-badge') as HTMLElement | null;
              if (scores[idx] !== null && scores[idx] !== undefined) {
                if (!badge) {
                  badge = document.createElement('span');
                  badge.className = 'score-badge';
                  // place badge to the right inside participant
                  badge.style.marginLeft = '0.5rem';
                  pEl.appendChild(badge);
                }
                badge.textContent = String(scores[idx]);
              } else if (badge) {
                badge.remove();
              }
            });
          } catch (err) {
            // Non-fatal: ignore badge rendering errors
          }
        } catch (err) {
          // Ignore any unexpected structure
          console.warn('Could not apply match visual state for', matchId, err);
        }
      }
    });
    // Animate rounds/columns with a small stagger for a reveal effect
    try {
      animateRounds();
    } catch (e) {}
  }

  function animateRounds() {
    if (!wrapperEl) return;
    const selectors = ['.round', '.rounds > div', '.matches-column', '.round-title', '[data-round-index]'];
    const rounds: HTMLElement[] = [];
    selectors.forEach((sel) => {
      wrapperEl!.querySelectorAll(sel).forEach((el) => {
        const h = el as HTMLElement;
        if (!rounds.includes(h)) rounds.push(h);
      });
    });

    rounds.forEach((rEl, i) => {
      rEl.classList.remove('round-reveal');
      setTimeout(() => {
        try { rEl.classList.add('round-reveal'); } catch (e) {}
      }, 80 * i);
    });
  }

  function focusNextParticipant(current: HTMLElement, delta: number) {
    if (!wrapperEl) return;
    const all = Array.from(wrapperEl.querySelectorAll('.participant')) as HTMLElement[];
    const idx = all.indexOf(current);
    if (idx === -1) return;
    const next = all[(idx + delta + all.length) % all.length];
    try { next.focus(); } catch (e) {}
  }

  async function onParticipantClick(matchId: number, participantSide: 1 | 2) {
    if (!lastManagerInstance || !lastDbInstance) {
      console.warn('Manager not available');
      return;
    }
    try {
      const payload: any = { id: matchId };
      if (participantSide === 1) {
        payload.opponent1 = { score: 1, result: 'win' };
        payload.opponent2 = { score: 0 };
      } else {
        payload.opponent1 = { score: 0 };
        payload.opponent2 = { score: 1, result: 'win' };
      }
      await lastManagerInstance.update.match(payload);
      const stages = lastDbInstance.data.stage || [];
      const matches = lastDbInstance.data.match || [];
      const participants = lastDbInstance.data.participant || [];
      lastManagerData = { stages, matches, participants, matchGames: lastDbInstance.data.match_game || [] };
      // re-render viewer
      if (wrapperEl) {
        const bracketData = buildBracketryData(matches, participants);
        wrapperEl.innerHTML = '';
        wrapperEl.style.height = '100%';
        const ok = await safeCreateBracket(bracketData, wrapperEl);
        if (ok) attachMatchClickHandlers();
      }
    } catch (e) {
      console.error('Could not update match', e);
    }
  }

  onMount(async () => {
    if (!wrapperEl) return;
    wrapperEl.innerHTML = '';
    wrapperEl.style.height = '100%';
    // Try to load saved random stage
    const raw = localStorage.getItem('randomStageData');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const matches = parsed.matches || [];
        const participants = parsed.participants || [];
        const bracketData = buildBracketryData(matches, participants);
        await safeCreateBracket(bracketData, wrapperEl);
        attachMatchClickHandlers();
        return;
      } catch (e) { console.warn('Could not parse randomStageData', e); }
    }

    // Fallback: build from pairs in localStorage
    try {
      const pairsRaw = localStorage.getItem('mus:pairs');
      const pairs = pairsRaw ? JSON.parse(pairsRaw) : [];
      if (!pairs || pairs.length === 0) {
        wrapperEl.innerHTML = '<div class="p-4 text-center text-gray-500">No hay parejas para mostrar el cuadro.</div>';
        return;
      }
      const pairLabels = pairs.map((p: any, i: number) => {
        if (p && typeof p === 'object' && 'a' in p && 'b' in p) return `${p.a} / ${p.b} #${i + 1}`;
        if (Array.isArray(p) && p[0] && p[1]) return `${p[0].name || p[0]} / ${p[1].name || p[1]} #${i + 1}`;
        return `Pair ${i + 1}`;
      });
      const seeding = pairLabels;
      const nextPow2 = (n: number) => { let p = 1; while (p < n) p <<= 1; return p; };
      const size = nextPow2(seeding.length);
      const { BracketsManager } = await import('@unitetheculture/brackets-manager');
      const { default: InMemoryStorage } = await import('../lib/inMemoryStorage');
      const db = new InMemoryStorage();
      const manager = new BracketsManager(db as any);
      await manager.create({ tournamentId: 0, name: 'Stage', type: 'single_elimination', seeding, settings: { size } });
      lastDbInstance = db;
      lastManagerInstance = manager;
      const matches = db.data.match || [];
      const participants = db.data.participant || [];
      const bracketData = buildBracketryData(matches, participants);
      await safeCreateBracket(bracketData, wrapperEl);
      attachMatchClickHandlers();
    } catch (e) {
      console.error('Could not build ephemeral stage for full-screen', e);
      wrapperEl!.innerHTML = '<div class="render-error p-4">Error building stage: ' + ((e as any)?.message || String(e)) + '</div>';
    }
  });

  onDestroy(() => {
    // cleanup
    try { if (wrapperEl) wrapperEl.innerHTML = ''; } catch (e) {}
  });
</script>

<style>
  :global(body) { margin: 0; }
  .koadroa-full {
    /* Break out of the centered container to occupy the full viewport width. */
    width: 100vw;
    margin-left: calc(50% - 50vw);
    height: calc(100vh - 56px); /* account for fixed header (h-14 = 56px) */
    display: block;
    overflow: auto;
    padding: 0;
    margin-top: 0;
    margin-bottom: 0;
  }
  #brackets-viewer-wrapper { width: 100%; height: 100%; }

  /* Force bracketry to occupy full available width */
  :global(.bracket-root) {
    width: 100% !important;
    --width: 100% !important; /* override internal width variable */
    --matchMaxWidth: 100% !important;
    display: block !important;
  }
  :global(.matches-positioner) {
    width: 100% !important;
    margin-left: 0 !important;
  }
  :global(.equal-width-columns-grid) {
    grid-auto-columns: 1fr !important; /* distribute columns evenly */
  }
  :global(.matches-scroller) {
    overflow-x: auto !important;
  }
  :global(.round-titles-wrapper.equal-width-columns-grid) {
    width: 100% !important;
    margin-left: 0 !important;
  }
</style>

  <div class="card-board felt-bg">
  <div class="koadroa-full">
    <div id="brackets-viewer-wrapper" bind:this={wrapperEl}></div>
  </div>
</div>
