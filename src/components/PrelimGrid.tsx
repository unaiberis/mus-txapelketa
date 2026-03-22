import BracketCard from './BracketCard';
import { type Match } from '../lib/tournament';
import { t as tr, type Lang } from '../lib/i18n';

interface PrelimGridProps {
  matches: Match[];
  bestOf: number;
  allPairs?: string[];
  onResult: (matchId: string, score1: number, score2: number) => void;
  onEdit: (matchId: string) => void;
  lang: Lang;
}

export default function PrelimGrid({
  matches,
  bestOf,
  allPairs,
  onResult,
  onEdit,
  lang,
}: PrelimGridProps) {
  if (matches.length === 0) return null;

  const done = matches.filter((m) => m.winner).length;
  const total = matches.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="prelim-section">
      <style>{`
        .prelim-section {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 12px 16px 16px;
        }

        .prelim-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .prelim-title {
          font-family: var(--font-display);
          font-size: 1rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          flex-shrink: 0;
        }

        .prelim-progress-track {
          flex: 1;
          height: 3px;
          background: var(--color-border);
          border-radius: 2px;
          overflow: hidden;
        }

        .prelim-progress-bar {
          height: 100%;
          background: var(--color-accent);
          border-radius: 2px;
          transition: width 0.4s ease;
          opacity: 0.7;
        }

        .prelim-count {
          font-size: 0.65rem;
          color: var(--color-text-muted);
          flex-shrink: 0;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.05em;
        }

        .prelim-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(216px, 1fr));
          gap: 8px;
        }
      `}</style>

      <div className="prelim-header">
        <span className="prelim-title">
          {tr(lang, 'phase.prelimTitle', { count: total })}
        </span>
        <div className="prelim-progress-track">
          <div className="prelim-progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <span className="prelim-count">
          {done}/{total}
        </span>
      </div>

      <div className="prelim-grid">
        {matches.map((m) => (
          <BracketCard
            key={m.id}
            match={m}
            bestOf={bestOf}
            onResult={onResult}
            onEdit={onEdit}
            lang={lang}
            allPairs={allPairs}
          />
        ))}
      </div>
    </div>
  );
}