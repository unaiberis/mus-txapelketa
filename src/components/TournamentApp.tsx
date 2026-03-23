import {
  canonicalize,
  clearDownstream,
  computeAutoPrizes,
  defaultPrizeConfig,

  deriveSigningKey,
  detectPodium,
  downloadBlob,
  exportCSVString,
  generateBracket,
  isValidBestOf,
  parseCSVImport,
  preliminaryInfo,
  prizePool,
  registerResult,
  signExport,
  verifyAndImport,
  type Match,
  type MatchScore,
  type Phase,
  type Podium,
  type PrizeConfig,
  type TournamentExport,
  type TournamentState,
} from '../lib/tournament';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_LANG, LANGUAGES, t as tr, type Lang } from '../lib/i18n';
import EntropyMeter from './EntropyMeter';
import BracketView from './BracketView';
import useEntropy from '../hooks/useEntropy';
import toast, { Toaster } from 'react-hot-toast';
import { currencySymbol, percentToPresetKey, presetToPercentages, type AutoSplitPreset } from '../lib/format';
import PodiumView from './PodiumView';
import PrelimGrid from './PrelimGrid';
import RoundCardsView from './RoundCardsView';

type ExportFormat = 'json' | 'csv' | 'xlsx';
type BestOfMode = 'preset' | 'custom';

function isByeMatch(match: Match): boolean {
  return Boolean((match.pair1 && !match.pair2) || (!match.pair1 && match.pair2));
}



function cloneTournamentState(state: TournamentState): TournamentState {
  return {
    ...state,
    prelim: state.prelim.map((m) => ({ ...m, score: m.score ? { ...m.score } : undefined })),
    rounds: state.rounds.map((round) =>
      round.map((m) => ({
        ...m,
        score: m.score ? { ...m.score } : undefined,
      }))
    ),
  };
}

function buildStateFromVerifiedExport(payload: TournamentExport): TournamentState {
  return {
    phase: payload.phase,
    pairs: payload.pairs,
    shuffled: payload.shuffled,
    bestOf: payload.bestOf,
    prelim: payload.prelim,
    rounds: payload.rounds,
    seed: payload.seed,
    prizeConfig: payload.prizeConfig,
    podium: payload.podium,
  };
}

function collectMatchesFromXlsxRows(
  rows: Array<Record<string, unknown>>
): { prelim: Match[]; rounds: Match[][] } {
  const prelim: Match[] = [];
  const roundsByRound = new Map<number, Match[]>();

  const alt = (keys: string[]) => {
    return (r: Record<string, unknown>) => {
      for (const k of keys) {
        if (k in r && r[k] != null) return String(r[k]).trim();
      }
      // fallback: try case-insensitive match
      const lower = Object.keys(r).reduce<Record<string, string>>((acc, p) => {
        acc[p.toLowerCase()] = String(r[p] ?? '').trim();
        return acc;
      }, {});
      for (const k of keys) {
        const lk = k.toLowerCase();
        if (lk in lower && lower[lk]) return lower[lk];
      }
      return '';
    };
  };

  const phaseGetter = alt([
    'Fase', 'fase', 'Fasea', tr('es', 'export.csvHeaders.phase'), tr('en', 'export.csvHeaders.phase'), tr('fr', 'export.csvHeaders.phase'), tr('eu', 'export.csvHeaders.phase'),
  ]);
  const roundGetter = alt(['Ronda', 'ronda', 'Txanda', tr('es', 'export.csvHeaders.round'), tr('en', 'export.csvHeaders.round'), tr('fr', 'export.csvHeaders.round'), tr('eu', 'export.csvHeaders.round')]);
  const matchGetter = alt(['Partida', 'partida', tr('es', 'export.csvHeaders.match'), tr('en', 'export.csvHeaders.match'), tr('fr', 'export.csvHeaders.match'), tr('eu', 'export.csvHeaders.match')]);
  const pair1Getter = alt(['Pareja 1', 'pareja1', 'Bikotea 1', tr('es', 'export.csvHeaders.pair1'), tr('en', 'export.csvHeaders.pair1'), tr('fr', 'export.csvHeaders.pair1'), tr('eu', 'export.csvHeaders.pair1')]);
  const pair2Getter = alt(['Pareja 2', 'pareja2', 'Bikotea 2', tr('es', 'export.csvHeaders.pair2'), tr('en', 'export.csvHeaders.pair2'), tr('fr', 'export.csvHeaders.pair2'), tr('eu', 'export.csvHeaders.pair2')]);
  const s1Getter = alt(['Victorias P1', 'victorias p1', 'Victorias P1', tr('es', 'export.csvHeaders.victories1'), tr('en', 'export.csvHeaders.victories1'), tr('fr', 'export.csvHeaders.victories1'), tr('eu', 'export.csvHeaders.victories1')]);
  const s2Getter = alt(['Victorias P2', 'victorias p2', tr('es', 'export.csvHeaders.victories2'), tr('en', 'export.csvHeaders.victories2'), tr('fr', 'export.csvHeaders.victories2'), tr('eu', 'export.csvHeaders.victories2')]);
  const winnerGetter = alt(['Ganador', 'ganador', 'Irabazlea', tr('es', 'export.csvHeaders.winner'), tr('en', 'export.csvHeaders.winner'), tr('fr', 'export.csvHeaders.winner'), tr('eu', 'export.csvHeaders.winner')]);

  for (const row of rows) {
    const phaseRaw = phaseGetter(row);
    if (!phaseRaw) continue;

    const roundNum = Number.parseInt(String(roundGetter(row) || '0'), 10);
    const matchNum = Number.parseInt(String(matchGetter(row) || '1'), 10) - 1;
    const pair1Raw = String(pair1Getter(row) || 'BYE').trim();
    const pair2Raw = String(pair2Getter(row) || 'BYE').trim();
    const s1Raw = String(s1Getter(row) || '').trim();
    const s2Raw = String(s2Getter(row) || '').trim();
    const winnerRaw = String(winnerGetter(row) || '').trim();

    const score1 = s1Raw === '' ? undefined : Number.parseInt(s1Raw, 10);
    const score2 = s2Raw === '' ? undefined : Number.parseInt(s2Raw, 10);
    const hasValidScore = Number.isInteger(score1) && Number.isInteger(score2);
    const score: MatchScore | undefined = hasValidScore
      ? { score1: score1 as number, score2: score2 as number }
      : undefined;

    const match: Match = {
      id: phaseRaw.toLowerCase().startsWith('previa') ? `prelim-${Math.max(0, matchNum)}` : `r${Math.max(1, roundNum)}-${Math.max(0, matchNum)}`,
      pair1: pair1Raw === 'BYE' ? null : pair1Raw,
      pair2: pair2Raw === 'BYE' ? null : pair2Raw,
      score,
      winner: winnerRaw || undefined,
      round: phaseRaw.toLowerCase().startsWith('previa') ? 0 : Math.max(1, roundNum),
      isPrelim: phaseRaw.toLowerCase().startsWith('previa'),
    };

    if (match.isPrelim) {
      prelim.push(match);
    } else {
      const key = Math.max(1, roundNum);
      if (!roundsByRound.has(key)) roundsByRound.set(key, []);
      roundsByRound.get(key)?.push(match);
    }
  }

  prelim.sort((a, b) => a.id.localeCompare(b.id));

  const rounds: Match[][] = [...roundsByRound.keys()]
    .sort((a, b) => a - b)
    .map((roundNum) => {
      const matches = roundsByRound.get(roundNum) ?? [];
      return matches.sort((a, b) => a.id.localeCompare(b.id));
    });

  return { prelim, rounds };
}

function autoAdvanceByesInState(initial: TournamentState): TournamentState {
  const state = cloneTournamentState(initial);

  for (let changed = true; changed;) {
    changed = false;

    for (let i = 0; i < state.prelim.length; i++) {
      const m = state.prelim[i];
      if (!isByeMatch(m) || m.winner) continue;
      m.winner = m.pair1 ?? m.pair2 ?? undefined;
      m.score = undefined;

      const winner = m.winner;
      if (!winner) continue;
      let nullSlotIndex = 0;
      for (let r1Idx = 0; r1Idx < state.rounds[0].length; r1Idx++) {
        const candidate = state.rounds[0][r1Idx];
        if (candidate.pair1 === null) {
          if (nullSlotIndex === i) {
            candidate.pair1 = winner;
            break;
          }
          nullSlotIndex++;
        }
        if (candidate.pair2 === null) {
          if (nullSlotIndex === i) {
            candidate.pair2 = winner;
            break;
          }
          nullSlotIndex++;
        }
      }
      changed = true;
    }

    for (let r = 0; r < state.rounds.length; r++) {
      for (let mIdx = 0; mIdx < state.rounds[r].length; mIdx++) {
        const match = state.rounds[r][mIdx];
        // Only auto-advance true initial BYEs created at generation time.
        if (!isByeMatch(match) || match.winner || !match.initialBye) continue;

        const winner = match.pair1 ?? match.pair2;
        if (!winner) continue;

        match.winner = winner;
        match.score = undefined;

        if (r + 1 < state.rounds.length) {
          const nextMatchIdx = Math.floor(mIdx / 2);
          const slot = mIdx % 2 === 0 ? 'pair1' : 'pair2';
          const next = state.rounds[r + 1][nextMatchIdx];
          if (next && next[slot] == null) {
            next[slot] = winner;
          }
        }

        changed = true;
      }
    }
  }

  const podium = detectPodium(state);
  if (podium) {
    state.podium = podium;
    state.phase = 'finished';
  } else if (state.rounds.some((round) => round.some((m) => m.winner))) {
    state.phase = 'inProgress';
  }

  return state;
}

export default function TournamentApp({ initialLang }: { initialLang?: Lang }) {
  const [lang, setLang] = useState<Lang>(initialLang ?? DEFAULT_LANG);

  // Read persisted language only on the client after hydration to avoid SSR mismatch.
  // This will override the initial server-provided language if the user previously
  // selected a language stored in localStorage. Keeping this separation avoids
  // hydration mismatches while still respecting an explicit client preference.
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const stored = window.localStorage.getItem('museko:lang');
      if (stored && ['es', 'en', 'fr', 'eu'].includes(stored) && stored !== lang) setLang(stored as Lang);
    } catch {
      // noop
    }
  }, [lang]);
  const { score: entropyScore, finalize: finalizeEntropy, lockedSeed } = useEntropy();

  const [pairs, setPairs] = useState<string[]>([]);
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');
  const [bestOf, setBestOf] = useState(5);
  const [customBestOf, setCustomBestOf] = useState('');
  const [bestOfMode, setBestOfMode] = useState<BestOfMode>('preset');
  const [prizeConfig, setPrizeConfig] = useState<PrizeConfig>(defaultPrizeConfig);
  const [showPrizes, setShowPrizes] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [viewMode, setViewMode] = useState<'bracket' | 'rounds'>('bracket');

  const [importError, setImportError] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [pairError, setPairError] = useState<string>('');
  const [formatError, setFormatError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const input1Ref = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);

  const autoSplitPreset = useMemo<AutoSplitPreset>(() => {
    if (prizeConfig.prizeMode !== 'auto') return 'custom';
    return percentToPresetKey(prizeConfig.autoSplit);
  }, [prizeConfig.autoSplit, prizeConfig.prizeMode]);

  const poolAmount = useMemo(() => prizePool(prizeConfig.entryFee, pairs.length), [prizeConfig.entryFee, pairs.length]);

  const calcPrelim = useMemo(() => {
    if (pairs.length < 2) {
      return {
        target: 2,
        byeCount: 0,
        prelimPairs: 0,
        prelimMatches: 0,
      };
    }
    return preliminaryInfo(pairs.length);
  }, [pairs.length]);

  const actualBestOf = useMemo(() => {
    if (bestOfMode === 'preset') return bestOf;
    const parsed = Number.parseInt(customBestOf, 10);
    return parsed;
  }, [bestOf, bestOfMode, customBestOf]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('museko:lang', lang);
    } catch {
      // ignore
    }
  }, [lang]);

  useEffect(() => {
    if (importError) {
      try {
        toast.error(importError);
      } catch {
        // ignore toast failures
      }
    }
  }, [importError]);

  useEffect(() => {
    if (pairError) {
      try {
        toast.error(pairError);
      } catch {
        // ignore
      }
    }
  }, [pairError]);

  useEffect(() => {
    if (formatError) {
      try {
        toast.error(formatError);
      } catch {
        // ignore
      }
    }
  }, [formatError]);

  const addPair = useCallback(() => {
    if (tournament) return;
    setPairError('');
    const name1 = input1.trim();
    const name2 = input2.trim();

    if (!name1 || !name2) {
      setPairError(tr(lang, 'pairs.error.emptyNames'));
      return;
    }

    const pairName = `${name1} / ${name2}`;
    if (pairs.includes(pairName)) {
      setPairError(tr(lang, 'pairs.error.duplicate'));
      return;
    }

    setPairs((prev) => [...prev, pairName]);
    setInput1('');
    setInput2('');
    input1Ref.current?.focus();
  }, [input1, input2, pairs, tournament, lang]);


  const removePair = useCallback(
    (idx: number) => {
      if (tournament) return;
      setPairs((prev) => prev.filter((_, i) => i !== idx));
    },
    [tournament]
  );

  // Drag-and-drop reordering for pairs
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragSourceIdx, setDragSourceIdx] = useState<number | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const leaveTimerRef = useRef<number | null>(null);
  const enterCounterRef = useRef<number>(0);

  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    if (tournament) {
      e.preventDefault();
      return;
    }
    dragIndexRef.current = idx;
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(idx));
    } catch {
      // some browsers may throw when setting data; ignore
    }
    setDragSourceIdx(idx);
    console.log('[drag] start', { ts: Date.now(), src: idx });
  }, [tournament]);

  const handleDragOver = useCallback(
    (e: React.DragEvent, idx?: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const src = dragIndexRef.current;

      if (typeof idx === 'number') {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const desired = e.clientY < rect.top + rect.height / 2 ? idx : idx + 1;

        // cancel any pending leave clear when we re-enter/hover
        if (leaveTimerRef.current) {
          window.clearTimeout(leaveTimerRef.current);
          leaveTimerRef.current = null;
        }

        // No mover si el destino es la misma posición que el origen
        if (src != null && (desired === src || desired === src + 1)) {
          if (dragOverIndex !== null) {
            console.log('[drag] clear placeholder - hovering source', { ts: Date.now(), src, idx, desired });
            setDragOverIndex(null);
          }
          return;
        }

        if (dragOverIndex !== desired) {
          console.log('[drag] set placeholder', { ts: Date.now(), src, idx, desired, clientY: e.clientY, rectTop: rect.top, rectHeight: rect.height });
          setDragOverIndex(desired);
        }
      } else {
        // When hovering the container (not a particular item), only set
        // the placeholder at the end if the pointer is actually past the
        // last item's bottom. This avoids rapid toggling between an item
        // and the end when the cursor crosses small gaps.
        const lastIdx = pairs.length - 1;
        const lastEl = itemRefs.current[lastIdx] ?? null;
        if (lastEl) {
          try {
            const lastRect = lastEl.getBoundingClientRect();
            const tolerance = 4; // px
            if (e.clientY >= lastRect.bottom - tolerance) {
              if (dragOverIndex !== pairs.length) {
                console.log('[drag] set placeholder at end', { ts: Date.now(), src, desired: pairs.length, clientY: e.clientY, lastBottom: lastRect.bottom });
                setDragOverIndex(pairs.length);
              }
            } else {
              // Pointer is inside container but not beyond last item — do nothing
              // (keep current placeholder to avoid flicker)
            }
          } catch {
            if (dragOverIndex !== pairs.length) {
              console.log('[drag] set placeholder at end (fallback)', { ts: Date.now(), src, desired: pairs.length });
              setDragOverIndex(pairs.length);
            }
          }
        } else {
          // No items — safe to set to end (0)
          if (dragOverIndex !== pairs.length) {
            console.log('[drag] set placeholder at end (no items)', { ts: Date.now(), src, desired: pairs.length });
            setDragOverIndex(pairs.length);
          }
        }
      }
    },
    [dragOverIndex, pairs.length]
  );

  const handleDragEnter = useCallback((_e?: React.DragEvent) => {
    // Increment enter counter to track nested enters/leaves
    enterCounterRef.current = Math.max(0, enterCounterRef.current) + 1;
    // Cancel any pending leave clear when we re-enter
    if (leaveTimerRef.current) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const handleDragLeave = useCallback((e?: React.DragEvent) => {
    // If relatedTarget is inside the same container, ignore the leave
    try {
      const native = e?.nativeEvent as unknown as { relatedTarget?: EventTarget | null } | undefined;
      const related = (e?.relatedTarget ?? native?.relatedTarget) as Node | null;
      const cur = e?.currentTarget as Node | null;
      if (related && cur && cur.contains && cur.contains(related)) {
        return;
      }
    } catch {
      // ignore errors and fallthrough to clearing
    }
    // Decrement enter counter and only clear when it reaches zero.
    enterCounterRef.current = Math.max(0, enterCounterRef.current - 1);

    // If no drag in progress or there's nothing to clear, skip scheduling
    if (dragIndexRef.current == null || dragOverIndex === null) return;

    // If there are still nested entered elements, don't clear yet
    if (enterCounterRef.current > 0) return;

    // Debounce clearing to avoid flicker when moving between children
    if (leaveTimerRef.current) window.clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = window.setTimeout(() => {
      // Only clear (and log) if the placeholder is currently visible
      setDragOverIndex((cur) => {
        if (cur !== null) {
          console.log('[drag] leave - clear placeholder (debounced)', { ts: Date.now() });
          return null;
        }
        return cur;
      });
      leaveTimerRef.current = null;
    }, 80) as unknown as number;
  }, [dragOverIndex]);

  const handleDrop = useCallback((e: React.DragEvent, destIdx: number) => {
    e.preventDefault();
    if (tournament) return;
    const srcStr = e.dataTransfer.getData('text/plain');
    const src = srcStr ? Number.parseInt(srcStr, 10) : dragIndexRef.current;
    if (src == null || Number.isNaN(src)) return;
    // Use the current dragOverIndex as desired drop location (may be idx or idx+1)
    let desired = dragOverIndex ?? destIdx;
    if (desired == null) desired = destIdx;
    console.log('[drag] drop', { ts: Date.now(), src, destIdx, desired });

    setPairs((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(src, 1);
      // clamp desired to bounds of the array after removal
      const insertAt = Math.min(Math.max(0, desired), copy.length);
      copy.splice(insertAt, 0, moved);
      return copy;
    });
    dragIndexRef.current = null;
    setDragOverIndex(null);
    setDragSourceIdx(null);
    enterCounterRef.current = 0;
    if (leaveTimerRef.current) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, [tournament, dragOverIndex]);

  const handleDragEnd = useCallback(() => {
    console.log('[drag] end', { ts: Date.now() });
    dragIndexRef.current = null;
    setDragSourceIdx(null);
    setDragOverIndex(null);
    enterCounterRef.current = 0;
  }, []);

  const setPrizeMode = useCallback((mode: 'manual' | 'auto') => {
    setPrizeConfig((prev) => {
      if (mode === 'manual') {
        return {
          ...prev,
          prizeMode: 'manual',
        };
      }

      const prizes = computeAutoPrizes(prev.entryFee, pairs.length, prev.autoSplit);
      return {
        ...prev,
        prizeMode: 'auto',
        prizes,
      };
    });
  }, [pairs.length]);

  useEffect(() => {
    setPrizeConfig((prev) => {
      if (prev.prizeMode !== 'auto') return prev;
      return {
        ...prev,
        prizes: computeAutoPrizes(prev.entryFee, pairs.length, prev.autoSplit),
      };
    });
  }, [pairs.length]);

  const createTournament = useCallback(() => {
    setFormatError('');
    if (pairs.length < 2) {
      setPairError(tr(lang, 'create.needPairs'));
      return;
    }

    const seed = finalizeEntropy();

    if (!isValidBestOf(actualBestOf)) {
      setFormatError(tr(lang, 'format.invalidCustom'));
      return;
    }

    const state = generateBracket(pairs, seed, actualBestOf, prizeConfig);
    const withByes = autoAdvanceByesInState(state);
    setTournament(withByes);
  }, [actualBestOf, pairs, prizeConfig, finalizeEntropy, lang]);

  const handleResult = useCallback(
    (matchId: string, score1: number, score2: number) => {
      if (!tournament) return;
      try {
        const newState = registerResult(tournament, matchId, score1, score2);
        setTournament(autoAdvanceByesInState(newState));
      } catch {
        // MatchCard shows local error state for invalid submit paths.
      }
    },
    [tournament]
  );

  const handleEdit = useCallback(
    (matchId: string) => {
      if (!tournament) return;
      if (!window.confirm(tr(lang, 'match.confirmEdit'))) return;
      const newState = clearDownstream(tournament, matchId);
      setTournament(newState);
    },
    [tournament, lang]
  );

  const handleExport = useCallback(async () => {
    if (!tournament) return;
    const signed = await signExport(tournament);

    if (exportFormat === 'json') {
      const blob = new Blob([JSON.stringify(signed, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `torneo-mus-${Date.now()}.json`);
      return;
    }

    if (exportFormat === 'csv') {
      const csv = exportCSVString(signed);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, `torneo-mus-${Date.now()}.csv`);
      return;
    }

    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    const matchRows: Array<Array<string | number>> = [
      [
        tr(lang, 'export.csvHeaders.phase'),
        tr(lang, 'export.csvHeaders.round'),
        tr(lang, 'export.csvHeaders.match'),
        tr(lang, 'export.csvHeaders.pair1'),
        tr(lang, 'export.csvHeaders.pair2'),
        tr(lang, 'export.csvHeaders.victories1'),
        tr(lang, 'export.csvHeaders.victories2'),
        tr(lang, 'export.csvHeaders.winner'),
      ],
      ...signed.prelim.map((m, i) => [
        tr(lang, 'prelim.card.prelimRound'),
        0,
        i + 1,
        m.pair1 ?? 'BYE',
        m.pair2 ?? 'BYE',
        m.score?.score1 ?? '',
        m.score?.score2 ?? '',
        m.winner ?? '',
      ]),
      ...signed.rounds.flatMap((round, r) =>
        round.map((m, i) => [
          tr(lang, 'round.header', { n: r + 1 }),
          r + 1,
          i + 1,
          m.pair1 ?? 'BYE',
          m.pair2 ?? 'BYE',
          m.score?.score1 ?? '',
          m.score?.score2 ?? '',
          m.winner ?? '',
        ])
      ),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(matchRows), tr(lang, 'export.xlsx.matches'));

    const metaRows: Array<[string, string | number]> = [
      [tr(lang, 'export.sheet.field'), tr(lang, 'export.sheet.value')],
      ['version', signed.version],
      ['seed', signed.seed],
      ['bestOf', signed.bestOf],
      ['exportedAt', signed.exportedAt],
      ['pairs', JSON.stringify(signed.pairs)],
      ['shuffled', JSON.stringify(signed.shuffled)],
      ['phase', signed.phase],
      ['prizeConfig', JSON.stringify(signed.prizeConfig)],
      ['podium', JSON.stringify(signed.podium ?? null)],
      ['signature', signed.signature],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(metaRows), tr(lang, 'export.xlsx.meta'));

    const prizeRows: Array<[string, string | number]> = [
      [tr(lang, 'export.sheet.field'), tr(lang, 'export.sheet.value')],
      [tr(lang, 'fees.entryFee'), `${signed.prizeConfig.entryFee} ${currencySymbol(signed.prizeConfig.currency)}`],
      [tr(lang, 'fees.pool'), `${prizePool(signed.prizeConfig.entryFee, signed.pairs.length)} ${currencySymbol(signed.prizeConfig.currency)}`],
      [tr(lang, 'export.prize.first'), `${signed.prizeConfig.prizes[0]} ${currencySymbol(signed.prizeConfig.currency)}`],
      [tr(lang, 'export.prize.second'), `${signed.prizeConfig.prizes[1]} ${currencySymbol(signed.prizeConfig.currency)}`],
      [tr(lang, 'export.prize.third'), `${signed.prizeConfig.prizes[2]} ${currencySymbol(signed.prizeConfig.currency)}`],
      [tr(lang, 'export.prize.fourth'), `${signed.prizeConfig.prizes[3]} ${currencySymbol(signed.prizeConfig.currency)}`],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prizeRows), tr(lang, 'export.xlsx.prizes'));

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    downloadBlob(
      new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `torneo-mus-${Date.now()}.xlsx`
    );
  }, [exportFormat, tournament, lang]);

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImportError(null);

      try {
        let state: TournamentState;

        if (file.name.endsWith('.xlsx')) {
          const XLSX = await import('xlsx');
          const buffer = await file.arrayBuffer();
          const wb = XLSX.read(buffer);

          const metaSheet = wb.Sheets.Metadata || wb.Sheets.Metadatos || wb.Sheets.Meta || wb.Sheets.Metadatuak || wb.Sheets['Metadonnées'];
          const matchSheet = wb.Sheets.Matches || wb.Sheets.Partidas || wb.Sheets.Matchs || wb.Sheets.Partidak;
          if (!metaSheet || !matchSheet) {
            throw new Error(tr(lang, 'import.missingSheets'));
          }

          const metaRows = XLSX.utils.sheet_to_json<Array<string | number>>(metaSheet, { header: 1 });
          const meta: Record<string, string> = {};
          const headerNames = new Set(['Campo', 'Field', 'Champ', 'Eremua', tr(lang, 'export.sheet.field')]);
          for (const row of metaRows) {
            const field = row[0];
            const value = row[1];
            if (!field || headerNames.has(String(field))) continue;
            meta[String(field)] = String(value ?? '');
          }

          const matchRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(matchSheet);
          const reconstructed = collectMatchesFromXlsxRows(matchRows);

          const payload: Omit<TournamentExport, 'signature'> = {
            version: (meta.version || '1') as '1',
            exportedAt: meta.exportedAt || '',
            seed: Number.parseInt(meta.seed || '0', 10),
            bestOf: Number.parseInt(meta.bestOf || '5', 10),
            pairs: JSON.parse(meta.pairs || '[]') as string[],
            shuffled: JSON.parse(meta.shuffled || '[]') as string[],
            phase: (meta.phase || 'generated') as Phase,
            prizeConfig: meta.prizeConfig
              ? (JSON.parse(meta.prizeConfig) as PrizeConfig)
              : defaultPrizeConfig,
            podium:
              meta.podium && meta.podium !== 'null'
                ? (JSON.parse(meta.podium) as Podium)
                : undefined,
            prelim: reconstructed.prelim,
            rounds: reconstructed.rounds,
          };

          const signature = meta.signature || '';
          const key = await deriveSigningKey(payload.seed);
          const canonical = canonicalize(payload as unknown as Record<string, unknown>);
          const sigBytes = new Uint8Array((signature.match(/.{2}/g) || []).map((h) => Number.parseInt(h, 16)));

          const valid = await crypto.subtle.verify(
            'HMAC',
            key,
            sigBytes,
            new TextEncoder().encode(canonical)
          );
          if (!valid) throw new Error(tr(lang, 'import.invalidSignature.xlsx'));

          state = buildStateFromVerifiedExport({ ...payload, signature });
        } else if (file.name.endsWith('.csv')) {
          const text = await file.text();
          const csvExport = parseCSVImport(text);
          const { signature, ...payload } = csvExport;

          const key = await deriveSigningKey(payload.seed);
          const canonical = canonicalize(payload as unknown as Record<string, unknown>);
          const sigBytes = new Uint8Array((signature.match(/.{2}/g) || []).map((h) => Number.parseInt(h, 16)));
          const valid = await crypto.subtle.verify(
            'HMAC',
            key,
            sigBytes,
            new TextEncoder().encode(canonical)
          );
          if (!valid) throw new Error(tr(lang, 'import.invalidSignature.csv'));

          state = {
            phase: payload.phase,
            pairs: payload.pairs,
            shuffled: payload.shuffled,
            bestOf: payload.bestOf,
            prelim: payload.prelim,
            rounds: payload.rounds,
            seed: payload.seed,
            prizeConfig: payload.prizeConfig,
            podium: payload.podium,
          };
        } else {
          const text = await file.text();
          state = await verifyAndImport(text);
        }

        const withByes = autoAdvanceByesInState(state);
        setTournament(withByes);
        setPairs(withByes.pairs);
        setBestOf(withByes.bestOf);
        setBestOfMode([3, 5, 7, 9].includes(withByes.bestOf) ? 'preset' : 'custom');
        setCustomBestOf([3, 5, 7, 9].includes(withByes.bestOf) ? '' : String(withByes.bestOf));
        setPrizeConfig(withByes.prizeConfig);
      } catch (err: unknown) {
        setImportError(err instanceof Error ? err.message : tr(lang, 'error.importFile'));
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [lang]
  );

  const resetTournament = useCallback(() => {
    if (!window.confirm(tr(lang, 'confirmReset'))) return;
    setTournament(null);
  }, [lang]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header
        className="app-header h-14 flex items-center px-6 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-accent)',
            fontSize: '1.8rem',
            letterSpacing: '0.1em',
          }}
        >
          {tr(lang, 'header.title')}
        </h1>
        <div className="ml-auto flex items-center gap-4">
          <button
            type="button"
            aria-pressed={!showSidebar}
            onClick={() => setShowSidebar((s) => !s)}
            className="text-sm px-2 py-1 rounded border"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}
            title={showSidebar ? tr(lang, 'ui.hideSidebar') ?? 'Ocultar panel' : tr(lang, 'ui.showSidebar') ?? 'Mostrar panel'}
          >
            {showSidebar ? 'Ocultar' : 'Mostrar'}
          </button>
          {tournament && (
            <>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {tr(lang, 'seed')}: #{tournament.seed.toString(16)}
              </span>
              <span
                className="text-sm px-2 py-1 rounded"
                style={{ background: 'var(--color-surface2)', color: 'var(--color-accent)' }}
              >
                {tr(lang, 'bestOfBadge', { bestOf: tournament.bestOf })}
              </span>
            </>
          )}
          <div className="ml-2 flex items-center gap-2">
            <label className="sr-only">{tr(lang, 'ui.language')}</label>
            <nav aria-label={tr(lang, 'ui.language')}>
              <ul className="flex gap-2" data-testid="header-lang-list">
                {LANGUAGES.map((l) => {
                  const href = l.code === DEFAULT_LANG ? '/' : `/${l.code}/`;
                  return (
                    <li key={l.code}>
                      <a
                        href={href}
                        onClick={(_e) => {
                          try {
                            if (typeof window !== 'undefined') window.localStorage.setItem('museko:lang', l.code);
                          } catch {
                            /* noop */
                          }
                          // Let the browser navigate normally to the prefixed page
                        }}
                        className={"text-sm px-2 py-1 rounded " + (lang === l.code ? 'bg-surface2' : '')}
                      >
                        {l.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <label className="sr-only">{tr(lang, 'importLabel')}</label>
            <input
              ref={fileInputRef}
              type="file"
              data-testid="header-import"
              className="form-input"
              onChange={handleImport}
              accept=".json,.csv,.xlsx"
            />
          </div>
        </div>
      </header>

      <Toaster position="top-right" />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {showSidebar && (
          <aside
            className="left-panel w-80 flex-shrink-0 overflow-y-auto p-4 border-r"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
        

          {!tournament && (
            <section className="mb-5 space-y-2">
              <input
                ref={input1Ref}
                type="text"
                className="form-input"
                placeholder={tr(lang, 'addPair.placeholder1')}
                value={input1}
                onChange={(e) => setInput1(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    // If the second input already has text, submit as if Add Pair was pressed
                    if (input2.trim() !== '') {
                      addPair();
                      return;
                    }
                    // Otherwise move focus to the second input
                    input2Ref.current?.focus();
                  }
                }}
              />
              <input
                ref={input2Ref}
                type="text"
                className="form-input"
                placeholder={tr(lang, 'addPair.placeholder2')}
                value={input2}
                onChange={(e) => setInput2(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    // If first input is empty and second has text, move focus to first
                    if (input1.trim() === '' && input2.trim() !== '') {
                      input1Ref.current?.focus();
                      return;
                    }
                    // Otherwise attempt to add the pair
                    addPair();
                  }
                }}
              />
              <button type="button" className="btn-primary w-full" onClick={addPair}>
                {tr(lang, 'addPair.addButton')}
              </button>
              
            </section>
          )}

          <section className="mb-5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                {tr(lang, 'pairs.title')} ({pairs.length})
              </h2>
              <div className="flex items-center gap-2">
                {pairs.length > 0 && !tournament && (
                  <button
                    type="button"
                    className="text-xs uppercase tracking-widest"
                    style={{ color: 'var(--color-text-muted)' }}
                    onClick={() => {
                      setPairs([]);
                      setPairError('');
                    }}
                  >
                    {tr(lang, 'pairs.clear')}
                  </button>
                )}

              </div>
            </div>
            <div
              className="max-h-64 overflow-y-auto pr-1"
              style={{ position: 'relative' }}
              onDragOver={(e) => { if (e.currentTarget === e.target) handleDragOver(e); }}
              onDrop={(e) => { if (e.currentTarget === e.target) handleDrop(e, pairs.length); }}
              onDragLeave={(e) => { if (e.currentTarget === e.target) handleDragLeave(); }}
              onDragEnter={(e) => { if (e.currentTarget === e.target) handleDragEnter(e); }}
            >
              {pairs.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {tr(lang, 'pairs.empty')}
                </p>
              ) : (
                <>
                  {(() => {
                    const items: React.ReactNode[] = [];

                    const Placeholder = () => (
                      <div
                        key="placeholder"
                        data-testid="drag-placeholder"
                        style={{
                          border: '2px dashed var(--color-accent)',
                          borderRadius: 6,
                          minHeight: 36,
                          opacity: 0.55,
                          margin: '2px 0',
                          background: 'transparent',
                          pointerEvents: 'none',
                        }}
                      />
                    );

                    pairs.forEach((pair, idx) => {
                      // Mostrar placeholder ANTES de este ítem si corresponde
                      const showBefore =
                        dragOverIndex === idx &&
                        dragSourceIdx !== null &&
                        dragOverIndex !== dragSourceIdx &&
                        dragOverIndex !== dragSourceIdx + 1;

                      if (showBefore) items.push(<Placeholder key={`placeholder-before-${idx}`} />);

                      items.push(
                        <div key={`${pair}-${idx}`}>
                          <div
                            ref={(el) => { itemRefs.current[idx] = el; }}
                            className="pair-list-item flex items-center justify-between gap-2"
                            style={{
                              opacity: dragSourceIdx === idx ? 0.35 : 1,
                              transition: 'opacity 150ms ease',
                            }}
                            draggable={!tournament}
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, idx)}
                            onDragEnd={handleDragEnd}
                            role="listitem"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted">#{idx + 1}</span>
                              <span className="truncate text-sm">{pair}</span>
                            </div>
                            {!tournament && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => removePair(idx)}
                                  className="text-xs uppercase tracking-widest"
                                  style={{ color: '#ef4444' }}
                                >
                                  {tr(lang, 'pairs.remove')}
                                </button>
                                <span
                                  className="text-xs text-muted"
                                  style={{ cursor: 'grab' }}
                                  aria-hidden
                                >
                                  ⋮
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });

                    // Placeholder al final de la lista
                    const showAtEnd =
                      dragOverIndex === pairs.length &&
                      dragSourceIdx !== null &&
                      dragOverIndex !== dragSourceIdx + 1;

                    if (showAtEnd) items.push(<Placeholder key="placeholder-end" />);

                    return items;
                  })()}
                </>
              )}
            </div>
          </section>

          <section className="mb-5">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded border px-3 py-2 text-left"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}
              onClick={() => setShowPrizes((prev) => !prev)}
            >
              <span className="text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                {tr(lang, 'fees.title')}
              </span>
              <span>{showPrizes ? '−' : '+'}</span>
            </button>

            {showPrizes && (
              <div className="mt-3 space-y-3 rounded border p-3" style={{ borderColor: 'var(--color-border)' }}>
                <label className="block space-y-1">
                  <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    {tr(lang, 'fees.entryFee')}
                  </span>
                  <input
                    type="number"
                    min={0}
                    className="form-input"
                    value={prizeConfig.entryFee}
                    disabled={Boolean(tournament)}
                    onChange={(e) => {
                      const val = Math.max(0, Number.parseInt(e.target.value || '0', 10));
                      setPrizeConfig((prev) => {
                        const base = { ...prev, entryFee: val };
                        if (base.prizeMode === 'auto') {
                          base.prizes = computeAutoPrizes(val, pairs.length, base.autoSplit);
                        }
                        return base;
                      });
                    }}
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs uppercase tracking-widest"
                    style={{
                      borderColor: prizeConfig.prizeMode === 'auto' ? 'var(--color-accent)' : 'var(--color-border)',
                      color: prizeConfig.prizeMode === 'auto' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    }}
                    disabled={Boolean(tournament)}
                    onClick={() => setPrizeMode('auto')}
                  >
                    {tr(lang, 'fees.auto')}
                  </button>
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs uppercase tracking-widest"
                    style={{
                      borderColor: prizeConfig.prizeMode === 'manual' ? 'var(--color-accent)' : 'var(--color-border)',
                      color: prizeConfig.prizeMode === 'manual' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    }}
                    disabled={Boolean(tournament)}
                    onClick={() => setPrizeMode('manual')}
                  >
                    {tr(lang, 'fees.manual')}
                  </button>
                </div>

                {prizeConfig.prizeMode === 'auto' && (
                  <label className="block space-y-1">
                    <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                      {tr(lang, 'fees.autoSplit')}
                    </span>
                    <select
                      className="form-input"
                      disabled={Boolean(tournament)}
                      value={autoSplitPreset}
                      onChange={(e) => {
                        const value = e.target.value as AutoSplitPreset;
                        if (value === 'custom') return;
                        const autoSplit = presetToPercentages(value);
                        setPrizeConfig((prev) => ({
                          ...prev,
                          autoSplit,
                          prizes: computeAutoPrizes(prev.entryFee, pairs.length, autoSplit),
                        }));
                      }}
                    >
                      <option value="50-30-15-5">50/30/15/5</option>
                      <option value="40-30-20-10">40/30/20/10</option>
                      <option value="60-25-10-5">60/25/10/5</option>
                    </select>
                  </label>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {prizeConfig.prizes.map((prize, idx) => (
                    <label key={`prize-${idx}`} className="block space-y-1">
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏅'} {tr(lang, 'prize.label', { n: idx + 1 })}
                      </span>
                      <input
                        type="number"
                        min={0}
                        className="form-input"
                        value={prize}
                        disabled={Boolean(tournament) || prizeConfig.prizeMode === 'auto'}
                        onChange={(e) => {
                          const val = Math.max(0, Number.parseInt(e.target.value || '0', 10));
                          setPrizeConfig((prev) => {
                            const prizes = [...prev.prizes] as [number, number, number, number];
                            prizes[idx] = val;
                            return { ...prev, prizes };
                          });
                        }}
                      />
                    </label>
                  ))}
                </div>

                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <input
                    type="checkbox"
                    checked={prizeConfig.thirdPlaceShared}
                    disabled={Boolean(tournament)}
                    onChange={(e) => {
                      setPrizeConfig((prev) => ({ ...prev, thirdPlaceShared: e.target.checked }));
                    }}
                  />
                  {tr(lang, 'prizes.thirdPlaceShared')}
                </label>

                <label className="block space-y-1">
                  <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    {tr(lang, 'fees.currency')}
                  </span>
                  <select
                    className="form-input"
                    value={prizeConfig.currency}
                    disabled={Boolean(tournament)}
                    onChange={(e) => {
                      setPrizeConfig((prev) => ({ ...prev, currency: e.target.value }));
                    }}
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </label>

                <div className="rounded border px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
                  <p style={{ color: 'var(--color-text-muted)' }}>
                    {tr(lang, 'fees.pool', { pool: poolAmount, currency: currencySymbol(prizeConfig.currency) })}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="mb-5 space-y-2">
            <h2 className="text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
              {tr(lang, 'format.title')}
            </h2>
            <select
              className="form-input"
              disabled={Boolean(tournament)}
              value={bestOfMode === 'custom' ? 'custom' : String(bestOf)}
              onChange={(e) => {
                setFormatError('');
                if (e.target.value === 'custom') {
                  setBestOfMode('custom');
                  return;
                }
                setBestOfMode('preset');
                setBestOf(Number.parseInt(e.target.value, 10));
              }}
            >
              <option value="3">{tr(lang, 'format.options.3')}</option>
              <option value="5">{tr(lang, 'format.options.5')}</option>
              <option value="7">{tr(lang, 'format.options.7')}</option>
              <option value="9">{tr(lang, 'format.options.9')}</option>
              <option value="custom">{tr(lang, 'format.options.custom')}</option>
            </select>

            {bestOfMode === 'custom' && (
              <input
                type="number"
                min={1}
                step={2}
                className="form-input"
                value={customBestOf}
                disabled={Boolean(tournament)}
                onChange={(e) => {
                  setCustomBestOf(e.target.value);
                  if (e.target.value.trim() === '') {
                    setFormatError('');
                    return;
                  }
                  const parsed = Number.parseInt(e.target.value, 10);
                  setFormatError(isValidBestOf(parsed) ? '' : tr(lang, 'format.invalidCustom'));
                }}
                placeholder={tr(lang, 'format.customPlaceholder')}
              />
            )}

            {formatError && <p className="score-error">{formatError}</p>}
          </section>

          <EntropyMeter score={entropyScore} seed={tournament?.seed ?? lockedSeed ?? undefined} lang={lang} />

          {!tournament && (
            <button type="button" className="btn-primary w-full" onClick={createTournament}>
              {tr(lang, 'create.label')}
            </button>
          )}

          {tournament && (
            <section className="mt-5 space-y-3">
              <h2 className="text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                {tr(lang, 'export.title')}
              </h2>
              <select
                className="form-input"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              >
                <option value="json">{tr(lang, 'export.option.json')}</option>
                <option value="csv">{tr(lang, 'export.option.csv')}</option>
                <option value="xlsx">{tr(lang, 'export.option.xlsx')}</option>
              </select>
              <button type="button" className="btn-primary w-full" onClick={handleExport}>
                {tr(lang, 'export.exportButton')}
              </button>
              <button
                type="button"
                className="w-full rounded border px-3 py-2 text-sm uppercase tracking-widest"
                style={{ borderColor: '#ef4444', color: '#ef4444' }}
                onClick={resetTournament}
              >
                {tr(lang, 'export.reset')}
              </button>
            </section>
          )}
          </aside>
        )}

        <main className="relative z-0 flex-1 overflow-auto p-6">
          {!tournament ? (
            <section className="relative z-10 mx-auto max-w-3xl rounded border p-6" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
              <h2 className="text-3xl uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)' }}>
                {tr(lang, 'setup.title')}
              </h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                {tr(lang, 'setup.description')}
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded border p-3" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    {tr(lang, 'prelim.card.prelimRound')}
                  </p>
                  <p className="text-lg">{tr(lang, 'prelim.card.matchesCount', { count: calcPrelim.prelimMatches })}</p>
                </div>
                <div className="rounded border p-3" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    {tr(lang, 'prelim.card.target')}
                  </p>
                  <p className="text-lg">{tr(lang, 'prelim.card.pairsCount', { count: calcPrelim.target })}</p>
                </div>
                <div className="rounded border p-3" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    {tr(lang, 'prelim.card.byes')}
                  </p>
                  <p className="text-lg">{calcPrelim.byeCount}</p>
                </div>
                <div className="rounded border p-3" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    {tr(lang, 'prelim.card.playPrelim')}
                  </p>
                  <p className="text-lg">{calcPrelim.prelimPairs}</p>
                </div>
              </div>
            </section>
          ) : (
            <>
              {tournament.phase === 'finished' && tournament.podium && (
                <PodiumView podium={tournament.podium} prizeConfig={tournament.prizeConfig} pairCount={tournament.pairs.length} lang={lang} />
              )}

              <section className="relative z-10 space-y-6">

                {tournament.prelim.length > 0 && (
                  <PrelimGrid
                    matches={tournament.prelim}
                    bestOf={tournament.bestOf}
                    allPairs={tournament.pairs}
                    onResult={handleResult}
                    onEdit={handleEdit}
                    lang={lang}
                  />
                )}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-xl uppercase tracking-widest"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)' }}
                    >
                      {tr(lang, 'bracket.title')}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={`rounded px-2 py-1 text-sm ${viewMode === 'bracket' ? 'border' : 'text-sm'}`}
                        onClick={() => setViewMode('bracket')}
                        aria-pressed={viewMode === 'bracket'}
                      >
                        {tr(lang, 'ui.view.bracket')}
                      </button>
                      <button
                        type="button"
                        className={`rounded px-2 py-1 text-sm ${viewMode === 'rounds' ? 'border' : 'text-sm'}`}
                        onClick={() => setViewMode('rounds')}
                        aria-pressed={viewMode === 'rounds'}
                      >
                        {tr(lang, 'ui.view.rounds')}
                      </button>
                    </div>
                  </div>

                  {viewMode === 'bracket' ? (
                    <div className="overflow-x-auto pb-4">
                      <BracketView rounds={tournament.rounds} bestOf={tournament.bestOf} allPairs={tournament.pairs} onResult={handleResult} onEdit={handleEdit} lang={lang} />
                    </div>
                  ) : (
                    <RoundCardsView rounds={tournament.rounds} bestOf={tournament.bestOf} allPairs={tournament.pairs} onResult={handleResult} onEdit={handleEdit} lang={lang} />
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
