import React, { useEffect, useState } from 'react';
import { isValidScore, type Match } from '../lib/tournament';
import { t as tr, type Lang } from '../lib/i18n';

export const BRACKET_CARD_H = 88; // px – fixed height kept constant for correct bracket alignment
export const BRACKET_CARD_W = 216; // px – fixed width

interface BracketCardProps {
  match: Match;
  bestOf: number;
  onResult: (matchId: string, s1: number, s2: number) => void;
  onEdit: (matchId: string) => void;
  lang: Lang;
  allPairs?: string[];
}

export default function BracketCard({
  match,
  bestOf,
  onResult,
  onEdit,
  lang,
  allPairs,
}: BracketCardProps) {
  const winsNeeded = Math.ceil(bestOf / 2);
  const isBye = Boolean(
    (match.pair1 && !match.pair2) || (!match.pair1 && match.pair2)
  );
  const isDone = Boolean(match.winner);
  const isPending = !match.pair1 && !match.pair2;

  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    setS1(match.score ? String(match.score.score1) : '');
    setS2(match.score ? String(match.score.score2) : '');
    setErr('');
  }, [match.id, match.score]);

  const submit = () => {
    const p1 = Number.parseInt(s1, 10);
    const p2 = Number.parseInt(s2, 10);
    if (Number.isNaN(p1) || Number.isNaN(p2)) {
      setErr('—');
      return;
    }
    if (!isValidScore(p1, p2, bestOf)) {
      setErr(`!${winsNeeded}`);
      return;
    }
    onResult(match.id, p1, p2);
    setErr('');
  };

  const seed = (name: string | null) => {
    if (!name || !allPairs) return null;
    const idx = allPairs.indexOf(name);
    return idx >= 0 ? idx + 1 : null;
  };

  const PairRow = ({
    name,
    isWinner,
    isLoser,
    right,
  }: {
    name: string | null;
    isWinner?: boolean;
    isLoser?: boolean;
    right?: React.ReactNode;
  }) => {
    const s = seed(name);
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 5px',
          borderRadius: 3,
          background: isWinner
            ? 'rgba(212,175,55,0.12)'
            : isLoser
            ? 'transparent'
            : undefined,
          opacity: isLoser ? 0.42 : 1,
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {s !== null && (
          <span
            style={{
              fontSize: '0.6rem',
              color: 'var(--color-text-muted)',
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            #{s}
          </span>
        )}
        <span
          style={{
            fontSize: '0.68rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
            color: isWinner ? 'var(--color-accent)' : 'var(--color-text)',
            fontWeight: isWinner ? 600 : 400,
          }}
          title={name ?? undefined}
        >
          {name ?? ''}
        </span>
        {right}
      </div>
    );
  };

  const Divider = () => (
    <div
      style={{
        height: 1,
        background: 'var(--color-border)',
        margin: '2px 4px',
        flexShrink: 0,
      }}
    />
  );

  /* ── Pending ─────────────────────────────────────────────────────────── */
  if (isPending) {
    return (
      <div className="bcard bcard--pending">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            opacity: 0.25,
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          {tr(lang, 'match.pending')}
        </div>
      </div>
    );
  }

  /* ── Bye ─────────────────────────────────────────────────────────────── */
  if (isBye) {
    const byePair = match.pair1 ?? match.pair2;
    return (
      <div className="bcard bcard--bye">
        <PairRow name={byePair} isWinner />
        <Divider />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
            fontSize: '0.58rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--color-text-muted)',
            opacity: 0.45,
          }}
        >
          {tr(lang, 'bye')}
        </div>
      </div>
    );
  }

  /* ── Done ────────────────────────────────────────────────────────────── */
  if (isDone) {
    return (
      <div className="bcard bcard--done">
        <PairRow
          name={match.pair1}
          isWinner={match.winner === match.pair1}
          isLoser={match.winner !== match.pair1}
          right={
            <strong
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                color:
                  match.winner === match.pair1
                    ? 'var(--color-accent)'
                    : 'var(--color-text-muted)',
                flexShrink: 0,
              }}
            >
              {match.score?.score1}
            </strong>
          }
        />
        <Divider />
        <PairRow
          name={match.pair2}
          isWinner={match.winner === match.pair2}
          isLoser={match.winner !== match.pair2}
          right={
            <strong
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                color:
                  match.winner === match.pair2
                    ? 'var(--color-accent)'
                    : 'var(--color-text-muted)',
                flexShrink: 0,
              }}
            >
              {match.score?.score2}
            </strong>
          }
        />
        <button
          type="button"
          className="bcard-edit"
          onClick={() => onEdit(match.id)}
          title={tr(lang, 'match.editAria')}
        >
          ✏️
        </button>
      </div>
    );
  }

  /* ── Active (score entry) ────────────────────────────────────────────── */
  const ScoreInput = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <input
      type="number"
      min={0}
      max={winsNeeded}
      className="bcard-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && submit()}
    />
  );

  return (
    <div className="bcard bcard--active">
      <PairRow
        name={match.pair1}
        right={<ScoreInput value={s1} onChange={setS1} />}
      />
      <Divider />
      <PairRow
        name={match.pair2}
        right={<ScoreInput value={s2} onChange={setS2} />}
      />
      <button type="button" className="bcard-submit" onClick={submit}>
        ✓
      </button>
      {err && (
        <span
          style={{
            position: 'absolute',
            bottom: 2,
            left: 6,
            fontSize: '0.58rem',
            color: '#ef4444',
          }}
        >
          {err}
        </span>
      )}
    </div>
  );
}