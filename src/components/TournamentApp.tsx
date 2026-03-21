import {
  canonicalize,
  clearDownstream,
  computeAutoPrizes,
  computeEntropyScore,
  defaultPrizeConfig,
  deriveSeed,
  deriveSigningKey,
  detectPodium,
  downloadBlob,
  exportCSVString,
  generateBracket,
  isValidBestOf,
  isValidScore,
  parseCSVImport,
  preliminaryInfo,
  prizePool,
  registerResult,
  signExport,
  verifyAndImport,
  type EntropyEvent,
  type Match,
  type MatchScore,
  type Phase,
  type Podium,
  type PrizeConfig,
  type TournamentExport,
  type TournamentState,
} from '../lib/tournament';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ExportFormat = 'json' | 'csv' | 'xlsx';
type BestOfMode = 'preset' | 'custom';
type AutoSplitPreset = '50-30-15-5' | '40-30-20-10' | '60-25-10-5' | 'custom';

interface EntropyMeterProps {
  score: number;
}

interface MatchCardProps {
  match: Match;
  bestOf: number;
  onResult: (matchId: string, score1: number, score2: number) => void;
  onEdit: (matchId: string) => void;
}

interface PodiumViewProps {
  podium: Podium;
  prizeConfig: PrizeConfig;
  pairCount: number;
}

function currencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    JPY: '¥',
  };
  return symbols[currency] || currency;
}

function percentToPresetKey(pct: [number, number, number, number]): AutoSplitPreset {
  const key = pct.join('-');
  if (key === '50-30-15-5') return '50-30-15-5';
  if (key === '40-30-20-10') return '40-30-20-10';
  if (key === '60-25-10-5') return '60-25-10-5';
  return 'custom';
}

function presetToPercentages(preset: AutoSplitPreset): [number, number, number, number] {
  if (preset === '50-30-15-5') return [50, 30, 15, 5];
  if (preset === '40-30-20-10') return [40, 30, 20, 10];
  if (preset === '60-25-10-5') return [60, 25, 10, 5];
  return [50, 30, 15, 5];
}

function EntropyMeter({ score }: EntropyMeterProps) {
  const clamped = Math.max(0, Math.min(100, score));

  const label =
    clamped >= 100
      ? 'Máxima - ¡Perfecto!'
      : clamped >= 80
        ? 'Muy alta'
        : clamped >= 60
          ? 'Alta'
          : clamped >= 40
            ? 'Media'
            : clamped >= 20
              ? 'Baja'
              : 'Sin aleatoriedad';

  const barColor =
    clamped >= 100
      ? '#10b981'
      : clamped >= 80
        ? '#22c55e'
        : clamped >= 60
          ? '#84cc16'
          : clamped >= 40
            ? '#eab308'
            : clamped >= 20
              ? '#f97316'
              : '#ef4444';

  return (
    <div className="entropy-meter">
      <div className="entropy-header flex items-center justify-between gap-2">
        <span className="entropy-title">Nivel de aleatoriedad</span>
        <span className="entropy-pct">{clamped}%</span>
      </div>
      <div className="entropy-track" aria-hidden="true">
        <div
          className="entropy-bar"
          style={{
            width: `${clamped}%`,
            backgroundColor: barColor,
            boxShadow: clamped >= 80 ? `0 0 8px ${barColor}` : 'none',
            animation: clamped >= 100 ? 'pulse-glow 1s ease-in-out infinite' : 'none',
            backgroundImage:
              clamped >= 100
                ? 'linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 100%)'
                : 'none',
            backgroundSize: clamped >= 100 ? '200% 100%' : undefined,
            backgroundPosition: clamped >= 100 ? 'center' : undefined,
          }}
        />
      </div>
      <p className="entropy-label">{label}</p>
      {clamped < 60 && (
        <p className="entropy-hint">Mueve el ratón y pulsa teclas para un sorteo más seguro.</p>
      )}
      {clamped >= 80 && <p className="entropy-secure">🛡 Sorteo seguro</p>}
    </div>
  );
}

function MatchCard({ match, bestOf, onResult, onEdit }: MatchCardProps) {
  const winsNeeded = Math.ceil(bestOf / 2);
  const isBye = (match.pair1 && !match.pair2) || (!match.pair1 && match.pair2);
  const isDone = Boolean(match.winner && match.score);
  const isLockedNoParticipants = !match.pair1 && !match.pair2;

  const [score1, setScore1] = useState<string>('');
  const [score2, setScore2] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setScore1(match.score ? String(match.score.score1) : '');
    setScore2(match.score ? String(match.score.score2) : '');
    setError('');
  }, [match.id, match.score]);

  const cardClass = isBye
    ? 'match-card match-card--bye'
    : isDone
      ? 'match-card match-card--done'
      : 'match-card match-card--active';

  const submitScore = () => {
    const parsed1 = Number.parseInt(score1, 10);
    const parsed2 = Number.parseInt(score2, 10);

    if (Number.isNaN(parsed1) || Number.isNaN(parsed2)) {
      setError('Debes introducir dos números.');
      return;
    }
    if (!isValidScore(parsed1, parsed2, bestOf)) {
      setError(`Marcador inválido para mejor de ${bestOf}. Debe ganar a ${winsNeeded}.`);
      return;
    }

    try {
      onResult(match.id, parsed1, parsed2);
      setError('');
    } catch {
      setError('No se pudo registrar el resultado.');
    }
  };

  return (
    <article className={cardClass}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          {match.isPrelim ? 'Previa' : `Ronda ${match.round}`}
        </span>
        <span
          className="rounded px-2 py-0.5 text-[0.7rem]"
          style={{
            background: 'var(--color-surface2)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-accent)',
          }}
        >
          BO{bestOf}
        </span>
      </div>

      {isLockedNoParticipants && (
        <div className="rounded border border-dashed p-3 text-center text-sm" style={{ borderColor: 'var(--color-border)' }}>
          Pendiente de clasificados...
        </div>
      )}

      {isBye && (
        <div className="space-y-2">
          <div className="rounded px-2 py-1 text-sm" style={{ background: 'var(--color-surface2)' }}>
            {match.pair1 ?? match.pair2}
          </div>
          <div className="vs-label">BYE</div>
          <div className="rounded px-2 py-1 text-xs" style={{ background: 'var(--color-border)' }}>
            Pasa automáticamente a la siguiente ronda.
          </div>
        </div>
      )}

      {!isBye && match.pair1 && match.pair2 && isDone && (
        <div className="space-y-2">
          <div className={match.winner === match.pair1 ? 'winner' : 'loser'}>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">{match.pair1}</span>
              <strong>{match.score?.score1}</strong>
            </div>
          </div>
          <div className="vs-label">VS</div>
          <div className={match.winner === match.pair2 ? 'winner' : 'loser'}>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">{match.pair2}</span>
              <strong>{match.score?.score2}</strong>
            </div>
          </div>
          <button
            type="button"
            className="edit-button"
            onClick={() => onEdit(match.id)}
            aria-label="Editar resultado"
            title="Editar resultado"
          >
            ✏️
          </button>
        </div>
      )}

      {!isBye && match.pair1 && match.pair2 && !isDone && (
        <div className="space-y-3">
          <div className="rounded px-2 py-1 text-sm" style={{ background: 'var(--color-surface2)' }}>
            {match.pair1}
          </div>
          <div className="vs-label">VS</div>
          <div className="rounded px-2 py-1 text-sm" style={{ background: 'var(--color-surface2)' }}>
            {match.pair2}
          </div>
          <div className="flex items-center justify-between gap-2">
            <input
              type="number"
              min={0}
              max={winsNeeded}
              className="score-input"
              value={score1}
              onChange={(e) => setScore1(e.target.value)}
              placeholder="0"
            />
            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
              -
            </span>
            <input
              type="number"
              min={0}
              max={winsNeeded}
              className="score-input"
              value={score2}
              onChange={(e) => setScore2(e.target.value)}
              placeholder="0"
            />
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs uppercase tracking-widest"
              style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
              onClick={submitScore}
            >
              Confirmar
            </button>
          </div>
          {error && <p className="score-error">{error}</p>}
        </div>
      )}
    </article>
  );
}

function PodiumView({ podium, prizeConfig, pairCount }: PodiumViewProps) {
  const pool = prizePool(prizeConfig.entryFee, pairCount);
  const rows: Array<{
    key: 'fourth' | 'third' | 'second' | 'first';
    label: string;
    name: string | null;
    prize: number;
    className: string;
    emoji: string;
  }> = [
    {
      key: 'fourth',
      label: '4º puesto',
      name: podium.fourth,
      prize: prizeConfig.prizes[3],
      className: 'podium-row podium-row--fourth',
      emoji: '🏅',
    },
    {
      key: 'third',
      label: prizeConfig.thirdPlaceShared ? '3º/4º compartido' : '3º puesto',
      name: podium.third,
      prize: prizeConfig.prizes[2],
      className: 'podium-row podium-row--third',
      emoji: '🥉',
    },
    {
      key: 'second',
      label: '2º puesto',
      name: podium.second,
      prize: prizeConfig.prizes[1],
      className: 'podium-row podium-row--second',
      emoji: '🥈',
    },
    {
      key: 'first',
      label: 'Campeón',
      name: podium.first,
      prize: prizeConfig.prizes[0],
      className: 'podium-row podium-row--first',
      emoji: '🥇',
    },
  ];

  return (
    <section className="relative z-10 mx-auto max-w-3xl">
      <div className="mb-6 text-center">
        <h2 className="text-4xl uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)' }}>
          Torneo finalizado
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Bote total: {pool} {currencySymbol(prizeConfig.currency)}
        </p>
      </div>

      <div className="space-y-3">
        {rows
          .filter((row) => Boolean(row.name))
          .map((row, idx) => (
            <div
              key={row.key}
              className={`${row.className} rounded border px-4 py-3`}
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-surface)',
                animation: 'fade-in-up 0.6s ease both',
                animationDelay: `${idx * 0.16}s`,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{row.emoji}</span>
                  <div>
                    <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                      {row.label}
                    </p>
                    <p className="text-lg" style={{ color: 'var(--color-text)' }}>
                      {row.name}
                    </p>
                  </div>
                </div>
                {row.prize > 0 && (
                  <p className="text-xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)' }}>
                    {row.prize} {currencySymbol(prizeConfig.currency)}
                  </p>
                )}
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}

function isByeMatch(match: Match): boolean {
  return Boolean((match.pair1 && !match.pair2) || (!match.pair1 && match.pair2));
}

function roundIndexFromId(matchId: string): number | null {
  const parsed = /^r(\d+)-\d+$/.exec(matchId);
  if (!parsed) return null;
  return Number.parseInt(parsed[1], 10) - 1;
}

function matchIndexFromId(matchId: string): number | null {
  const parsed = /^r\d+-(\d+)$/.exec(matchId);
  if (!parsed) return null;
  return Number.parseInt(parsed[1], 10);
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

  for (const row of rows) {
    const phaseRaw = String(row.Fase ?? row.fase ?? '').trim();
    if (!phaseRaw) continue;

    const roundNum = Number.parseInt(String(row.Ronda ?? row.ronda ?? '0'), 10);
    const matchNum = Number.parseInt(String(row.Partida ?? row.partida ?? '1'), 10) - 1;
    const pair1Raw = String(row['Pareja 1'] ?? row.pareja1 ?? 'BYE').trim();
    const pair2Raw = String(row['Pareja 2'] ?? row.pareja2 ?? 'BYE').trim();
    const s1Raw = String(row['Victorias P1'] ?? row.score1 ?? '').trim();
    const s2Raw = String(row['Victorias P2'] ?? row.score2 ?? '').trim();
    const winnerRaw = String(row.Ganador ?? row.ganador ?? '').trim();

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

  for (let changed = true; changed; ) {
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
        if (!isByeMatch(match) || match.winner) continue;

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

export default function TournamentApp() {
  const entropyRef = useRef<EntropyEvent[]>([]);
  const [entropyScore, setEntropyScore] = useState(0);
  const lastKeyTsRef = useRef(0);
  const lastMouseTsRef = useRef(0);

  const [pairs, setPairs] = useState<string[]>([]);
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');
  const [bestOf, setBestOf] = useState(5);
  const [customBestOf, setCustomBestOf] = useState('');
  const [bestOfMode, setBestOfMode] = useState<BestOfMode>('preset');
  const [prizeConfig, setPrizeConfig] = useState<PrizeConfig>(defaultPrizeConfig);
  const [showPrizes, setShowPrizes] = useState(false);

  const [tournament, setTournament] = useState<TournamentState | null>(null);

  const [importError, setImportError] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [pairError, setPairError] = useState<string>('');
  const [formatError, setFormatError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const input1Ref = useRef<HTMLInputElement>(null);

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
    const handleKeydown = (e: KeyboardEvent) => {
      const now = Date.now();
      entropyRef.current.push({
        t: 'k',
        key: e.key,
        ts: now,
        dt: now - lastKeyTsRef.current,
      });
      lastKeyTsRef.current = now;
      setEntropyScore(computeEntropyScore(entropyRef.current));
    };

    const handleMousemove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMouseTsRef.current < 50) return;
      lastMouseTsRef.current = now;
      entropyRef.current.push({
        t: 'm',
        x: e.clientX,
        y: e.clientY,
        ts: now,
      });
      setEntropyScore(computeEntropyScore(entropyRef.current));
    };

    const handleClick = (e: MouseEvent) => {
      entropyRef.current.push({ t: 'c', x: e.clientX, y: e.clientY, ts: Date.now() });
      setEntropyScore(computeEntropyScore(entropyRef.current));
    };

    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('mousemove', handleMousemove);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('mousemove', handleMousemove);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const addPair = useCallback(() => {
    if (tournament) return;
    setPairError('');
    const name1 = input1.trim();
    const name2 = input2.trim();

    if (!name1 || !name2) {
      setPairError('Debes introducir los dos nombres de la pareja.');
      return;
    }

    const pairName = `${name1} / ${name2}`;
    if (pairs.includes(pairName)) {
      setPairError('Esa pareja ya está registrada.');
      return;
    }

    setPairs((prev) => [...prev, pairName]);
    setInput1('');
    setInput2('');
    input1Ref.current?.focus();
  }, [input1, input2, pairs, tournament]);

  const removePair = useCallback(
    (idx: number) => {
      if (tournament) return;
      setPairs((prev) => prev.filter((_, i) => i !== idx));
    },
    [tournament]
  );

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
      setPairError('Necesitas al menos 2 parejas para crear el torneo.');
      return;
    }

    entropyRef.current.push({ t: 'c', x: 0, y: 0, ts: Date.now(), last: true });
    const seed = deriveSeed(entropyRef.current);

    if (!isValidBestOf(actualBestOf)) {
      setFormatError('El formato personalizado debe ser impar y mayor que 0.');
      return;
    }

    const state = generateBracket(pairs, seed, actualBestOf, prizeConfig);
    const withByes = autoAdvanceByesInState(state);
    setTournament(withByes);
  }, [actualBestOf, pairs, prizeConfig]);

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
      if (!window.confirm('Editar este resultado borrará los resultados dependientes. ¿Continuar?')) return;
      const newState = clearDownstream(tournament, matchId);
      setTournament(newState);
    },
    [tournament]
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
      ['Fase', 'Ronda', 'Partida', 'Pareja 1', 'Pareja 2', 'Victorias P1', 'Victorias P2', 'Ganador'],
      ...signed.prelim.map((m, i) => [
        'Previa',
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
          `Ronda ${r + 1}`,
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
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(matchRows), 'Partidas');

    const metaRows: Array<[string, string | number]> = [
      ['Campo', 'Valor'],
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
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(metaRows), 'Metadatos');

    const prizeRows: Array<[string, string | number]> = [
      ['Campo', 'Valor'],
      ['Cuota por pareja', `${signed.prizeConfig.entryFee} ${currencySymbol(signed.prizeConfig.currency)}`],
      ['Bote total', `${prizePool(signed.prizeConfig.entryFee, signed.pairs.length)} ${currencySymbol(signed.prizeConfig.currency)}`],
      ['1er premio', `${signed.prizeConfig.prizes[0]} ${currencySymbol(signed.prizeConfig.currency)}`],
      ['2º premio', `${signed.prizeConfig.prizes[1]} ${currencySymbol(signed.prizeConfig.currency)}`],
      ['3er premio', `${signed.prizeConfig.prizes[2]} ${currencySymbol(signed.prizeConfig.currency)}`],
      ['4º premio', `${signed.prizeConfig.prizes[3]} ${currencySymbol(signed.prizeConfig.currency)}`],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prizeRows), 'Premios');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    downloadBlob(
      new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `torneo-mus-${Date.now()}.xlsx`
    );
  }, [exportFormat, tournament]);

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

          const metaSheet = wb.Sheets.Metadatos;
          const matchSheet = wb.Sheets.Partidas;
          if (!metaSheet || !matchSheet) {
            throw new Error('Faltan hojas obligatorias: "Metadatos" o "Partidas".');
          }

          const metaRows = XLSX.utils.sheet_to_json<Array<string | number>>(metaSheet, { header: 1 });
          const meta: Record<string, string> = {};
          for (const row of metaRows) {
            const field = row[0];
            const value = row[1];
            if (!field || String(field) === 'Campo') continue;
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
          if (!valid) throw new Error('Firma inválida. El archivo XLSX fue alterado.');

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
          if (!valid) throw new Error('Firma inválida. El archivo CSV fue alterado.');

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
        setImportError(err instanceof Error ? err.message : 'Error al importar archivo.');
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    []
  );

  const resetTournament = useCallback(() => {
    if (!window.confirm('¿Reiniciar el torneo? Se perderán todos los resultados.')) return;
    setTournament(null);
  }, []);

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
          TORNEO DE MUS
        </h1>
        <div className="ml-auto flex items-center gap-4">
          {tournament && (
            <>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Seed: #{tournament.seed.toString(16)}
              </span>
              <span
                className="text-sm px-2 py-1 rounded"
                style={{ background: 'var(--color-surface2)', color: 'var(--color-accent)' }}
              >
                🔒 Al mejor de {tournament.bestOf}
              </span>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside
          className="left-panel w-80 flex-shrink-0 overflow-y-auto p-4 border-r"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <section className="mb-5 space-y-2">
            <h2 className="text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
              Importar
            </h2>
            <input
              ref={fileInputRef}
              type="file"
              className="form-input"
              onChange={handleImport}
              accept=".json,.csv,.xlsx"
            />
            {importError && <p className="score-error">{importError}</p>}
          </section>

          {!tournament && (
            <section className="mb-5 space-y-2">
              <h2 className="text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                Añadir pareja
              </h2>
              <input
                ref={input1Ref}
                type="text"
                className="form-input"
                placeholder="Jugador 1"
                value={input1}
                onChange={(e) => setInput1(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addPair();
                }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Jugador 2"
                value={input2}
                onChange={(e) => setInput2(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addPair();
                }}
              />
              <button type="button" className="btn-primary w-full" onClick={addPair}>
                Añadir pareja
              </button>
              {pairError && <p className="score-error">{pairError}</p>}
            </section>
          )}

          <section className="mb-5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                Parejas ({pairs.length})
              </h2>
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
                  Vaciar
                </button>
              )}
            </div>
            <div className="max-h-44 overflow-y-auto pr-1">
              {pairs.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Aún no hay parejas inscritas.
                </p>
              ) : (
                pairs.map((pair, idx) => (
                  <div key={pair} className="pair-list-item flex items-center justify-between gap-2">
                    <span className="truncate text-sm">{pair}</span>
                    {!tournament && (
                      <button
                        type="button"
                        onClick={() => removePair(idx)}
                        className="text-xs uppercase tracking-widest"
                        style={{ color: '#ef4444' }}
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                ))
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
                Cuotas y premios
              </span>
              <span>{showPrizes ? '−' : '+'}</span>
            </button>

            {showPrizes && (
              <div className="mt-3 space-y-3 rounded border p-3" style={{ borderColor: 'var(--color-border)' }}>
                <label className="block space-y-1">
                  <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    Cuota por pareja
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
                    Auto
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
                    Manual
                  </button>
                </div>

                {prizeConfig.prizeMode === 'auto' && (
                  <label className="block space-y-1">
                    <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                      Reparto automático
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
                      <option value="custom">Custom</option>
                    </select>
                  </label>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {prizeConfig.prizes.map((prize, idx) => (
                    <label key={`prize-${idx}`} className="block space-y-1">
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏅'} Premio {idx + 1}
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
                  3º puesto compartido
                </label>

                <label className="block space-y-1">
                  <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    Moneda
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
                    Bote total: <strong style={{ color: 'var(--color-text)' }}>{poolAmount}</strong>{' '}
                    {currencySymbol(prizeConfig.currency)}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="mb-5 space-y-2">
            <h2 className="text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
              Formato de partida
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
              <option value="3">Al mejor de 3</option>
              <option value="5">Al mejor de 5</option>
              <option value="7">Al mejor de 7</option>
              <option value="9">Al mejor de 9</option>
              <option value="custom">Personalizado</option>
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
                  setFormatError(isValidBestOf(parsed) ? '' : 'Debe ser un número impar mayor que 0.');
                }}
                placeholder="Ejemplo: 11"
              />
            )}

            {formatError && <p className="score-error">{formatError}</p>}
          </section>

          {!tournament && <EntropyMeter score={entropyScore} />}

          {!tournament && (
            <button type="button" className="btn-primary w-full" onClick={createTournament}>
              Crear torneo
            </button>
          )}

          {tournament && (
            <section className="mt-5 space-y-3">
              <h2 className="text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                Exportar
              </h2>
              <select
                className="form-input"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              >
                <option value="json">JSON firmado</option>
                <option value="csv">CSV firmado</option>
                <option value="xlsx">XLSX</option>
              </select>
              <button type="button" className="btn-primary w-full" onClick={handleExport}>
                Exportar torneo
              </button>
              <button
                type="button"
                className="w-full rounded border px-3 py-2 text-sm uppercase tracking-widest"
                style={{ borderColor: '#ef4444', color: '#ef4444' }}
                onClick={resetTournament}
              >
                Reiniciar torneo
              </button>
            </section>
          )}
        </aside>

        <main className="relative z-0 flex-1 overflow-auto p-6">
          {!tournament ? (
            <section className="relative z-10 mx-auto max-w-3xl rounded border p-6" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
              <h2 className="text-3xl uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)' }}>
                Configura tu torneo
              </h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                Añade parejas en el panel izquierdo, define premios y formato, y después crea el cuadro.
                El emparejamiento se realiza con una semilla basada en entropía de tus interacciones.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded border p-3" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    Ronda previa
                  </p>
                  <p className="text-lg">{calcPrelim.prelimMatches} partidas</p>
                </div>
                <div className="rounded border p-3" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    Cuadro objetivo
                  </p>
                  <p className="text-lg">{calcPrelim.target} parejas</p>
                </div>
                <div className="rounded border p-3" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    Pasan directas
                  </p>
                  <p className="text-lg">{calcPrelim.byeCount}</p>
                </div>
                <div className="rounded border p-3" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    Juegan previa
                  </p>
                  <p className="text-lg">{calcPrelim.prelimPairs}</p>
                </div>
              </div>
            </section>
          ) : tournament.phase === 'finished' && tournament.podium ? (
            <PodiumView podium={tournament.podium} prizeConfig={tournament.prizeConfig} pairCount={tournament.pairs.length} />
          ) : (
            <section className="relative z-10 space-y-6">
              <div className="rounded border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                <h2 className="text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                  Resumen del cuadro
                </h2>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Parejas: {tournament.pairs.length} | Formato: mejor de {tournament.bestOf} | Semilla: #
                  {tournament.seed.toString(16)}
                </p>
              </div>

              {tournament.prelim.length > 0 && (
                <div className="space-y-3">
                  <h3
                    className="text-xl uppercase tracking-widest"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)' }}
                  >
                    Fase previa ({tournament.prelim.length} partidas)
                  </h3>
                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                    {tournament.prelim.map((m) => (
                      <MatchCard
                        key={m.id}
                        match={m}
                        bestOf={tournament.bestOf}
                        onResult={handleResult}
                        onEdit={handleEdit}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h3
                  className="text-xl uppercase tracking-widest"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)' }}
                >
                  Cuadro principal
                </h3>
                <div className="overflow-x-auto pb-4">
                  <div className="flex min-w-max items-start gap-8">
                    {tournament.rounds.map((round, rIdx) => (
                      <div
                        key={`round-${rIdx}`}
                        className="flex flex-col justify-around"
                        style={{ gap: `${Math.pow(2, rIdx) * 2}rem` }}
                      >
                        <h4 className="mb-1 text-center text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                          Round {rIdx + 1}
                        </h4>
                        {round.map((m) => (
                          <div key={m.id} className="relative">
                            <MatchCard match={m} bestOf={tournament.bestOf} onResult={handleResult} onEdit={handleEdit} />
                            {rIdx < tournament.rounds.length - 1 && (
                              <div
                                className="bracket-line-h"
                                style={{
                                  left: '100%',
                                  width: '2rem',
                                  animationDelay: `${(roundIndexFromId(m.id) ?? rIdx) * 0.12}s`,
                                }}
                              />
                            )}
                            {rIdx < tournament.rounds.length - 1 && matchIndexFromId(m.id) !== null && matchIndexFromId(m.id)! % 2 === 0 && (
                              <div
                                className="bracket-line-v"
                                style={{
                                  right: '-2rem',
                                  top: '50%',
                                  height: `${Math.pow(2, rIdx) * 2}rem`,
                                  animationDelay: `${rIdx * 0.12}s`,
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
