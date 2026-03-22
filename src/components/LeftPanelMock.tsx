import { t as tr, type Lang } from '../lib/i18n';

export default function LeftPanelMock() {
  const lang: Lang = 'eu';
  return (
    <aside className="left-panel card">
      <section className="mb-6">
        <h2 className="text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          {tr(lang, 'left.pairEntryHeader')}
        </h2>
        <div className="space-y-2 mt-2">
          <input className="form-input" placeholder={tr(lang, 'addPair.placeholder1')} />
          <input className="form-input" placeholder={tr(lang, 'addPair.placeholder2')} />
          <button className="btn-primary w-full">{tr(lang, 'left.createButton')}</button>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-xs uppercase" style={{ color: 'var(--color-text-muted)' }}>{tr(lang, 'left.prizesLabel')}</h3>
        <div className="mt-2">
          <input className="form-input" placeholder="Sarrera kuota" />
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-xs uppercase" style={{ color: 'var(--color-text-muted)' }}>{tr(lang, 'left.bestOfLabel')}</h3>
        <div className="mt-2">
          <select className="form-input">
            <option>3</option>
            <option selected>5</option>
            <option>7</option>
          </select>
        </div>
      </section>

      <section className="mb-6">
        <div className="entropy-meter card">
          <div className="entropy-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="entropy-title">{tr(lang, 'entropy.title')}</span>
            <span className="entropy-pct">0%</span>
          </div>
          <div className="entropy-track" aria-hidden="true">
            <div className="entropy-bar" style={{ width: '0%' }} data-score={0} />
          </div>
          <p className="entropy-label">{tr(lang, 'entropy.labels.none')}</p>
        </div>
      </section>

    </aside>
  );
}
