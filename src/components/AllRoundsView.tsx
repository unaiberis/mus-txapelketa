import BracketCard from './BracketCard';
import { type Match } from '../lib/tournament';
import { t as tr, type Lang } from '../lib/i18n';

interface AllRoundsViewProps {
  prelim: Match[];
  rounds: Match[][];
  bestOf: number;
  allPairs?: string[];
  onResult: (matchId: string, score1: number, score2: number) => void;
  onEdit: (matchId: string) => void;
  lang: Lang;
  filter?: 'all' | 'prelim' | number;
  numColumns?: number;
}

function splitToColumns<T>(items: T[], numCols: number): T[][] {
  const n = Math.max(1, numCols);
  const perCol = Math.ceil(items.length / n);
  const result: T[][] = Array.from({ length: n }, () => []);
  items.forEach((item, i) => result[Math.floor(i / perCol)].push(item));
  return result.filter((c) => c.length > 0);
}

function roundLabel(rIdx: number, total: number, lang: Lang): string {
  if (rIdx === total - 1) return 'Final';
  if (rIdx === total - 2 && total > 2) return 'Semifinal';
  if (rIdx === total - 3 && total > 3) return 'Cuartos';
  return tr(lang, 'round.header', { n: rIdx + 1 });
}

export default function AllRoundsView({
  prelim,
  rounds,
  bestOf,
  allPairs,
  onResult,
  onEdit,
  lang,
  filter = 'all',
  numColumns = 4,
}: AllRoundsViewProps) {
  const sections: Array<{ key: string; title: string; matches: Match[]; isFinal?: boolean }> = [];

  if ((filter === 'all' || filter === 'prelim') && prelim.length > 0) {
    sections.push({
      key: 'prelim',
      title: tr(lang, 'phase.prelimTitle', { count: prelim.length }),
      matches: prelim,
    });
  }

  if (filter === 'all') {
    rounds.forEach((matches, rIdx) => {
      sections.push({
        key: `r${rIdx}`,
        title: roundLabel(rIdx, rounds.length, lang),
        matches,
        isFinal: rIdx === rounds.length - 1,
      });
    });
  } else if (typeof filter === 'number') {
    const idx = filter - 1;
    if (rounds[idx]) {
      sections.push({
        key: `r${idx}`,
        title: roundLabel(idx, rounds.length, lang),
        matches: rounds[idx],
        isFinal: idx === rounds.length - 1,
      });
    }
  }

  if (sections.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {sections.map(({ key, title, matches, isFinal }) => {
        const done = matches.filter((m) => m.winner).length;
        const total = matches.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const cols = splitToColumns(matches, numColumns);

        const numColsEffective = Math.min(numColumns, cols.length || 1);

        return (
          <section
            key={key}
            className="rounded-lg border p-3"
            style={{
              background: 'var(--color-surface)',
              borderColor: isFinal ? 'var(--color-accent)' : 'var(--color-border)',
            }}
          >
            {/* ── Section header ─────────────────────────────────────── */}
            <div className="mb-3 flex items-center gap-3">
              <span
                className="shrink-0 text-xs uppercase tracking-widest"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.9rem',
                  letterSpacing: '0.18em',
                  color: isFinal ? 'var(--color-accent)' : 'var(--color-text-muted)',
                }}
              >
                {title}
              </span>

              {/* Progress bar */}
              {!isFinal && (
                <>
                  <div
                    className="h-px flex-1 overflow-hidden rounded-full"
                    style={{ background: 'var(--color-border)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: 'var(--color-accent)',
                        opacity: 0.55,
                      }}
                    />
                  </div>
                  <span
                    className="shrink-0 tabular-nums"
                    style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}
                  >
                    {done}/{total}
                  </span>
                </>
              )}
            </div>

            {/* ── Card columns ───────────────────────────────────────── */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${numColsEffective}, minmax(0, 1fr))`,
                gap: '8px',
                alignItems: 'start',
              }}
            >
              {cols.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-2" style={{ width: '100%' }}>
                  {col.map((m) => (
                    <BracketCard
                      key={m.id}
                      match={m}
                      bestOf={bestOf}
                      onResult={onResult}
                      onEdit={onEdit}
                      lang={lang}
                      allPairs={allPairs}
                      style={{ width: '100%' }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
