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
  const sym = currencySymbol(prizeConfig.currency);

  const MEDALS = ['🥇', '🥈', '🥉'];

  const PLACES = [
    {
      key: 'second' as const,
      label: tr(lang, 'podium.labels.second'),
      name: podium.second,
      prize: prizeConfig.prizes[1],
      platformH: 100,
      accentColor: '#94a3b8',
      accentGlow: 'rgba(148,163,184,0.20)',
      rank: 2,
      medal: MEDALS[1],
      delay: '0.25s',
    },
    {
      key: 'first' as const,
      label: tr(lang, 'podium.labels.first'),
      name: podium.first,
      prize: prizeConfig.prizes[0],
      platformH: 160,
      accentColor: 'var(--accent-gold)',
      accentGlow: 'var(--color-accent-glow)',
      rank: 1,
      medal: MEDALS[0],
      delay: '0.0s',
    },
    {
      key: 'third' as const,
      label: prizeConfig.thirdPlaceShared
        ? tr(lang, 'podium.labels.thirdShared')
        : tr(lang, 'podium.labels.third'),
      name: podium.third,
      prize: prizeConfig.prizes[2],
      platformH: 70,
      accentColor: '#b45309',
      accentGlow: 'rgba(180,83,9,0.20)',
      rank: 3,
      medal: MEDALS[2],
      delay: '0.40s',
    },
  ];

  return (
    <section
      style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '700px',
        margin: '0 auto',
        padding: '0 1rem 2rem',
      }}
    >
      {/* ── Title ── */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-accent)',
            fontSize: '3rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            margin: 0,
            lineHeight: 1,
          }}
        >
          {tr(lang, 'podium.title')}
        </h2>
        <p
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.06em',
          }}
        >
          {tr(lang, 'podium.pool', { pool, currency: sym })}
        </p>
      </div>

      {/* ── Podium Stage ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '6px',
          /* bottom glow line */
          borderBottom: '2px solid var(--color-accent)',
          boxShadow: '0 2px 20px var(--color-accent-glow)',
          paddingBottom: 0,
        }}
      >
        {PLACES.map((p) =>
          p.name ? (
            <div
              key={p.key}
              style={{
                flex: p.rank === 1 ? '0 0 220px' : '0 0 180px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                animation: 'fade-in-up 0.6s ease both',
                animationDelay: p.delay,
              }}
            >
              {/* ── Card above the platform ── */}
              <div
                style={{
                  width: '100%',
                  background: 'var(--color-surface)',
                  border: `1px solid ${p.accentColor}`,
                  borderRadius: '8px',
                  padding: '12px 10px',
                  textAlign: 'center',
                  marginBottom: '8px',
                  boxShadow: `0 0 16px ${p.accentGlow}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* shimmer strip at top */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: p.accentColor,
                    opacity: 0.9,
                  }}
                />
                <div style={{ fontSize: '1.6rem', lineHeight: 1, marginBottom: '6px' }}>
                  {p.medal}
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: p.rank === 1 ? '1.4rem' : '1.1rem',
                    color: 'var(--color-text)',
                    margin: '0 0 4px',
                    letterSpacing: '0.04em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.name}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1rem',
                    color: p.accentColor,
                    margin: 0,
                    letterSpacing: '0.06em',
                  }}
                >
                  {p.prize} {sym}
                </p>
              </div>

              {/* ── Platform block ── */}
              <div
                style={{
                  width: '100%',
                  height: `${p.platformH}px`,
                  background:
                    p.rank === 1
                      ? 'linear-gradient(to bottom, #2d2410, #1a1508)'
                      : p.rank === 2
                        ? 'linear-gradient(to bottom, #1e2225, #131619)'
                        : 'linear-gradient(to bottom, #26160d, #160d07)',
                  border: `1px solid ${p.accentColor}`,
                  borderBottom: 'none',
                  borderRadius: '4px 4px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* subtle inner gloss */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '40%',
                    background: `linear-gradient(to bottom, ${p.accentColor}18, transparent)`,
                    pointerEvents: 'none',
                  }}
                />
                {/* rank number */}
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: p.rank === 1 ? '4rem' : '3rem',
                    color: p.accentColor,
                    opacity: 0.35,
                    lineHeight: 1,
                    userSelect: 'none',
                  }}
                >
                  {p.rank}
                </span>

                {/* label at bottom */}
                <span
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    fontSize: '0.6rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: p.accentColor,
                    opacity: 0.7,
                  }}
                >
                  {p.label}
                </span>
              </div>
            </div>
          ) : null
        )}
      </div>

      {/* ── 4th place row ── */}
      {podium.fourth && (
        <div
          style={{
            marginTop: '20px',
            padding: '12px 16px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fade-in-up 0.6s ease both',
            animationDelay: '0.55s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.4rem',
                color: 'var(--color-text-muted)',
                opacity: 0.5,
                width: '24px',
                textAlign: 'center',
              }}
            >
              4
            </span>
            <div>
              <p
                style={{
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--color-text-muted)',
                  margin: '0 0 2px',
                }}
              >
                {tr(lang, 'podium.labels.fourth')}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  color: 'var(--color-text)',
                  margin: 0,
                }}
              >
                {podium.fourth}
              </p>
            </div>
          </div>
          {prizeConfig.prizes[3] > 0 && (
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                color: 'var(--color-text-muted)',
              }}
            >
              {prizeConfig.prizes[3]} {sym}
            </span>
          )}
        </div>
      )}
    </section>
  );
}