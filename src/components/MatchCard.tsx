import React, { useEffect, useState } from 'react';
import type { Match } from '../lib/tournament';
import { isValidScore } from '../lib/tournament';
import { t as tr, type Lang } from '../lib/i18n';

interface MatchCardProps {
  match: Match;
  bestOf: number;
  onResult: (matchId: string, s1: number, s2: number) => void;
  onEdit: (matchId: string) => void;
  lang: Lang;
  allPairs?: string[];
}

export default function MatchCard({ match, bestOf, onResult, onEdit, lang, allPairs }: MatchCardProps) {
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

  const cardClass = 'card ' + (isBye ? 'match-card match-card--bye' : isDone ? 'match-card match-card--done' : 'match-card match-card--active');

  const renderPair = (pairName: string | null) => {
    if (!pairName) return null;
    const idx = allPairs?.indexOf(pairName) ?? -1;
    return (
      <div className="flex items-center gap-2">
        {idx >= 0 && <span className="text-xs text-muted">#{idx + 1}</span>}
        <span className="truncate" title={pairName}>{pairName}</span>
      </div>
    );
  };

  const submitScore = () => {
    const parsed1 = Number.parseInt(score1, 10);
    const parsed2 = Number.parseInt(score2, 10);

    if (Number.isNaN(parsed1) || Number.isNaN(parsed2)) {
      setError(tr(lang, 'match.error.nan'));
      return;
    }
    if (!isValidScore(parsed1, parsed2, bestOf)) {
      setError(tr(lang, 'match.error.invalidScore', { bestOf, winsNeeded } as any));
      return;
    }

    try {
      onResult(match.id, parsed1, parsed2);
      setError('');
    } catch {
      setError(tr(lang, 'match.error.registerFail'));
    }
  };

  return (
    <article className={cardClass}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          {match.isPrelim ? tr(lang, 'match.prelimLabel') : tr(lang, 'match.roundLabel', { round: match.round } as any)}
        </span>
        <span className="badge badge--small badge--green">{tr(lang, 'match.boBadge', { bestOf } as any)}</span>
      </div>

      {isLockedNoParticipants && (
        <div className="rounded border border-dashed p-3 text-center text-sm" style={{ borderColor: 'var(--color-border)' }}>
          {tr(lang, 'match.pending')}
        </div>
      )}

      {isBye && (
        <div className="space-y-2">
          <div className="rounded px-2 py-1 text-sm" style={{ background: 'var(--color-surface2)' }}>
            {renderPair(match.pair1 ?? match.pair2)}
          </div>
          <div className="vs-label">{tr(lang, 'bye')}</div>
          <div className="rounded px-2 py-1 text-xs" style={{ background: 'var(--color-border)' }}>
            {tr(lang, 'match.byeInfo')}
          </div>
        </div>
      )}

      {!isBye && match.pair1 && match.pair2 && isDone && (
        <div className="space-y-2">
          <div className={match.winner === match.pair1 ? 'winner' : 'loser'}>
            <div className="flex items-center justify-between gap-2">
              {renderPair(match.pair1)}
              <strong>{match.score?.score1}</strong>
            </div>
          </div>
          <div className="vs-label">{tr(lang, 'match.vs')}</div>
          <div className={match.winner === match.pair2 ? 'winner' : 'loser'}>
            <div className="flex items-center justify-between gap-2">
              {renderPair(match.pair2)}
              <strong>{match.score?.score2}</strong>
            </div>
          </div>
          <button
            type="button"
            className="edit-button"
            onClick={() => onEdit(match.id)}
            aria-label={tr(lang, 'match.editAria')}
            title={tr(lang, 'match.editAria')}
          >
            ✏️
          </button>
        </div>
      )}

      {!isBye && match.pair1 && match.pair2 && !isDone && (
        <div className="space-y-3">
          <div className="rounded px-2 py-1 text-sm" style={{ background: 'var(--color-surface2)' }}>{renderPair(match.pair1)}</div>
          <div className="vs-label">{tr(lang, 'match.vs')}</div>
          <div className="rounded px-2 py-1 text-sm" style={{ background: 'var(--color-surface2)' }}>{renderPair(match.pair2)}</div>
          <div className="flex items-center justify-between gap-2">
            <input
              type="number"
              min={0}
              max={winsNeeded}
              className="form-input"
              value={score1}
              onChange={(e) => setScore1(e.target.value)}
              placeholder={tr(lang, 'match.placeholderScore')}
            />
            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>-</span>
            <input
              type="number"
              min={0}
              max={winsNeeded}
              className="form-input"
              value={score2}
              onChange={(e) => setScore2(e.target.value)}
              placeholder={tr(lang, 'match.placeholderScore')}
            />
            <button type="button" className="btn-primary" onClick={submitScore}>{tr(lang, 'button.confirm')}</button>
          </div>
          {error && <p className="score-error">{error}</p>}
        </div>
      )}
    </article>
  );
}
