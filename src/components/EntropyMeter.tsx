import { t } from '../lib/i18n';

export interface EntropyMeterProps {
  score: number;
  seed?: string | number;
  lang?: import('../lib/i18n').Lang;
}

export default function EntropyMeter({ score, seed, lang = 'es' }: EntropyMeterProps) {
  const clamped = Math.max(0, Math.min(100, Math.floor(score)));

  if (seed !== undefined && seed !== null) {
    const short = typeof seed === 'number' ? seed.toString(16).slice(0, 8) : String(seed).slice(0, 8);
    return (
      <div className="entropy-meter">
        <div className="entropy-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="entropy-title">{t(lang, 'entropy.title')}</span>
          <span className="entropy-pct">{t(lang, 'seed')}: #{short} 🔒</span>
        </div>
        <div className="entropy-track" aria-hidden>
          <div className="entropy-bar" style={{ width: '100%', backgroundColor: '#94a3b8' }} data-score={100} />
        </div>
        <p className="entropy-label">{t(lang, 'entropy.labels.none')}</p>
      </div>
    );
  }

  const label =
    clamped >= 100
      ? t(lang, 'entropy.labels.max')
      : clamped >= 80
      ? t(lang, 'entropy.labels.veryHigh')
      : clamped >= 60
      ? t(lang, 'entropy.labels.high')
      : clamped >= 40
      ? t(lang, 'entropy.labels.medium')
      : clamped >= 20
      ? t(lang, 'entropy.labels.low')
      : t(lang, 'entropy.labels.none');

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
      <div className="entropy-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="entropy-title">{t(lang, 'entropy.title')}</span>
        <span className="entropy-pct">{clamped}%</span>
      </div>
      <div className="entropy-track" aria-hidden>
        <div
          className="entropy-bar"
          data-score={clamped}
          style={{
            width: `${clamped}%`,
            backgroundColor: barColor,
            boxShadow: clamped >= 80 ? `0 0 8px ${barColor}` : 'none',
            animation: clamped >= 100 ? 'pulse-glow 1s ease-in-out infinite' : 'none',
          }}
        />
      </div>
      <p className="entropy-label">{label}</p>
    </div>
  );
}
