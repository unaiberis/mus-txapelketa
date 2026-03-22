// React import not required with new JSX transform
import type { Podium, PrizeConfig } from '../lib/tournament';
import { prizePool } from '../lib/tournament';
import { t as tr, type Lang } from '../lib/i18n';
import { currencySymbol } from '../lib/format';

interface PodiumViewProps {
  podium: Podium;
  prizeConfig: PrizeConfig;
  pairCount: number;
  lang: Lang;
}

export default function PodiumView({ podium, prizeConfig, pairCount, lang }: PodiumViewProps) {
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
      label: tr(lang, 'podium.labels.fourth'),
      name: podium.fourth,
      prize: prizeConfig.prizes[3],
      className: 'podium-row podium-row--fourth',
      emoji: '🏅',
    },
    {
      key: 'third',
      label: prizeConfig.thirdPlaceShared ? tr(lang, 'podium.labels.thirdShared') : tr(lang, 'podium.labels.third'),
      name: podium.third,
      prize: prizeConfig.prizes[2],
      className: 'podium-row podium-row--third',
      emoji: '🥉',
    },
    {
      key: 'second',
      label: tr(lang, 'podium.labels.second'),
      name: podium.second,
      prize: prizeConfig.prizes[1],
      className: 'podium-row podium-row--second',
      emoji: '🥈',
    },
    {
      key: 'first',
      label: tr(lang, 'podium.labels.first'),
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
          {tr(lang, 'podium.title')}
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {tr(lang, 'podium.pool', { pool, currency: currencySymbol(prizeConfig.currency) })}
        </p>
      </div>

      <div className="space-y-3">
        {rows
          .filter((row) => Boolean(row.name))
          .map((row, idx) => (
            <div
              key={row.key}
              className={`${row.className} podium-place card`}
              style={{
                borderColor: 'var(--color-border)',
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
                    <p className="text-lg" style={{ color: 'var(--color-text)' }}>{row.name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    {tr(lang, 'fees.title')}
                  </h2>
                  <div>
                    {row.prize} {currencySymbol(prizeConfig.currency)}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
