import React from 'react';
import MatchCard from './MatchCard';
import { type Match } from '../lib/tournament';
import { t as tr, type Lang } from '../lib/i18n';

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

export interface BracketViewProps {
  rounds: Match[][];
  bestOf: number;
  allPairs?: string[];
  onResult: (matchId: string, score1: number, score2: number) => void;
  onEdit: (matchId: string) => void;
  lang: Lang;
}

export default function BracketView({ rounds, bestOf, allPairs, onResult, onEdit, lang }: BracketViewProps) {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max items-start gap-8">
          {rounds.map((round, rIdx) => {
            // Use a smaller base gap (rem) so bracket columns are more compact
            const baseGapRem = 0.9; // previous factor was 2
            const gapRem = Math.pow(2, rIdx) * baseGapRem;
            return (
              <div key={`round-${rIdx}`} className="flex flex-col justify-around" style={{ gap: `${gapRem}rem` }}>
              <h4 className="mb-1 text-center text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                {tr(lang, 'round.header', { n: rIdx + 1 } as any)}
              </h4>
              {round.map((m) => (
                <div key={m.id} className="relative">
                  <MatchCard match={m} bestOf={bestOf} onResult={onResult} onEdit={onEdit} lang={lang} allPairs={allPairs} />
                  {rIdx < rounds.length - 1 && (
                    <div
                      className="bracket-line-h"
                      style={{
                        left: '100%',
                        width: '1.6rem',
                        animationDelay: `${(roundIndexFromId(m.id) ?? rIdx) * 0.12}s`,
                      }}
                    />
                  )}
                  {rIdx < rounds.length - 1 && matchIndexFromId(m.id) !== null && matchIndexFromId(m.id)! % 2 === 0 && (
                    <div
                      className="bracket-line-v"
                      style={{
                        right: '-1.6rem',
                        top: '50%',
                        height: `${Math.pow(2, rIdx) * baseGapRem}rem`,
                        animationDelay: `${rIdx * 0.12}s`,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
