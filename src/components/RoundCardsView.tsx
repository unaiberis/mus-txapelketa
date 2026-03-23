import React from 'react';
import BracketCard from './BracketCard';
import { type Match } from '../lib/tournament';
import { t as tr, type Lang } from '../lib/i18n';

interface RoundCardsViewProps {
  rounds: Match[][];
  bestOf: number;
  allPairs?: string[];
  onResult: (matchId: string, score1: number, score2: number) => void;
  onEdit: (matchId: string) => void;
  lang: Lang;
}

export default function RoundCardsView({ rounds, bestOf, allPairs, onResult, onEdit, lang }: RoundCardsViewProps) {
  if (!rounds || rounds.length === 0) return null;

  return (
    <div className="rounds-stack space-y-6">

      {rounds.map((r, idx) => (
        <section key={`round-${idx}`} className="round-section">
          <div className="round-header">
            <h4 className="round-title">{r.length === 0 ? tr(lang, 'round.empty') : tr(lang, 'round.header', { n: idx + 1 } as any)}</h4>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{r.length} {tr(lang, 'round.matches')}</div>
          </div>

          <div className="round-grid">
            {r.map((m) => (
              <BracketCard key={m.id} match={m} bestOf={bestOf} onResult={onResult} onEdit={onEdit} lang={lang} allPairs={allPairs} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
