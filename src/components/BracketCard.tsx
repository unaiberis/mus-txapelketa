import React, { useState } from 'react';
import { type Match } from '../lib/tournament';
import { t as tr, type Lang } from '../lib/i18n';

export const BRACKET_CARD_H = 88;
export const BRACKET_CARD_W = 216;

interface Props {
  match: Match;
  bestOf: number;
  allPairs?: string[];
  onResult: (matchId: string, score1: number, score2: number) => void;
  onEdit: (matchId: string) => void;
  lang: Lang;
  style?: React.CSSProperties;
}

export default function BracketCard({ match, bestOf: _bestOf, onResult, onEdit, lang, style }: Props) {
  const [s1, setS1] = useState<number>(match.score?.score1 ?? 0);
  const [s2, setS2] = useState<number>(match.score?.score2 ?? 0);

  const pair1 = match.pair1 ?? tr(lang, 'pair.placeholder');
  const pair2 = match.pair2 ?? tr(lang, 'pair.placeholder');

  return (
    <div
      className="bcard"
      style={{
        width: BRACKET_CARD_W,
        height: BRACKET_CARD_H,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        padding: 8,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        ...style,
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{match.id}</div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, fontSize: 13 }}>{pair1}</div>
        <div style={{ width: 40, textAlign: 'center' }}>
          <input
            aria-label="score1"
            type="number"
            value={s1}
            onChange={(e) => setS1(parseInt(e.target.value || '0', 10))}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, fontSize: 13 }}>{pair2}</div>
        <div style={{ width: 40, textAlign: 'center' }}>
          <input
            aria-label="score2"
            type="number"
            value={s2}
            onChange={(e) => setS2(parseInt(e.target.value || '0', 10))}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={() => onEdit(match.id)}
          style={{ background: 'transparent', border: 'none', color: 'var(--color-accent)' }}
        >
          {tr(lang, 'action.edit')}
        </button>
        <button
          onClick={() => onResult(match.id, Number(s1), Number(s2))}
          style={{ background: 'var(--color-accent)', border: 'none', color: 'white', padding: '6px 8px', borderRadius: 6 }}
        >
          {tr(lang, 'action.save')}
        </button>
      </div>
    </div>
  );
}
