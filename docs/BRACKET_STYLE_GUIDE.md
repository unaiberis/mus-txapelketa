# Bracket Style Guide — Estética oscura y legible

Resumen
- Tono: oscuro, contraste alto para lectura en pantallas de torneo.
- Forma: tarjetas con bordes suaves, sutiles sombras profundas, acentos verde/dorado.
- Objetivo: sensación profesional, accesible y enfocada en claridad de información (matches, scores, seed).

## Tokens de color y espacio (usar en CSS variables)
- **--color-bg**: #07101a         — fondo principal (muy oscuro)
- **--color-surface**: #0e1720    — superficie principal
- **--color-surface2**: #122029   — superficie secundaria (cards / meters)
- **--color-border**: rgba(255,255,255,0.06) — bordes sutiles
- **--color-text**: #E6F2EF       — texto principal (alto contraste)
- **--color-text-muted**: rgba(230,242,239,0.65) — texto secundario / hints
- **--accent-green**: #22c55e     — acento primario (acción, éxito)
- **--accent-gold**: #d4af37      — acento secundario (premios, podium)
- **--glass-bg**: rgba(255,255,255,0.03) — uso para overlays semitransparentes
- **--radius-card**: 12px
- **--shadow-card**: 0 8px 24px rgba(2,6,23,0.6)
- **--focus-ring**: 0 0 0 4px rgba(34,197,94,0.16)
- **--space-gutter**: 1rem

## Reglas de uso (resumen)
- Fondo: aplicar `--color-bg` a `body` y paneles a gran escala.
- Superficies y tarjetas: usar `--color-surface` y `--color-surface2`. `--color-surface2` para controles interiores (EntropyMeter, badges agrupados).
- Bordes: finos y muy bajos (`--color-border`) para separar áreas sin romper el tono oscuro.
- Tipografía: texto principal en `--color-text`; hints y labels en `--color-text-muted`.
- Acentos: botones primarios y estados activos en `--accent-green`; medallas/podium en `--accent-gold`.
- Sombras y elevación: `--shadow-card` bajo las tarjetas para legibilidad sobre el fondo.
- Radio y separación: tarjetas con `--radius-card` y padding = 0.75 * `--space-gutter`.
- Focus: mostrar `--focus-ring` con `:focus-visible` para accesibilidad.
- Motion: transiciones suaves en anchos/colores; respetar `prefers-reduced-motion`.

## Component usage patterns

- Card (MatchCard): información principal (equipos, scores) — fondo `--color-surface2`, borde `--color-border`, sombra `--shadow-card`.
- Badge (formatos, seed, estado): usar variantes:
  - `.badge--green` → background: rgba(accent-green, 0.12); border: accent-green tint.
  - `.badge--gold` → background: rgba(accent-gold, 0.12); border: gold tint.
- EntropyMeter: colocar en la izquierda, arriba del botón "Crear torneo". Meter usa `--color-surface2` de fondo, barra con glow cuando >= 80%.

## Short markup examples

### MatchCard (JSX/HTML)
```jsx
<article className="card match-card" aria-labelledby="match-42">
  <header className="match-card__head">
    <span className="badge badge--small badge--gold">Ronda 1</span>
    <span className="match-seed badge badge--small">Seed: #3f2a91b</span>
  </header>

  <div className="match-card__body">
    <div className="teams">
      <div className="team">Pareja A</div>
      <div className="score">3</div>
      <div className="vs">—</div>
      <div className="score">1</div>
      <div className="team">Pareja B</div>
    </div>
    <div className="match-meta">
      <span className="badge badge--small badge--green">Al mejor de 5</span>
    </div>
  </div>
</article>
```
- Clases clave: `card`, `badge`, `match-card__head`, `match-card__body`.
- Visual: usar `--color-surface2` para la card interior; scores destacados con `--color-text`.

### EntropyMeter (JSX/HTML)
```jsx
<div className="card entropy-meter" role="status" aria-live="polite">
  <div className="entropy-header">
    <span className="entropy-title">🎲 Aleatoriedad</span>
    <span className="entropy-value">72%</span>
  </div>

  <div className="entropy-track" aria-hidden="true">
    <div className="entropy-bar" style={{ width: `${score}%` }} />
  </div>

  <p className="entropy-label">Alta — buen nivel para el sorteo</p>
</div>
```
- Clases clave: `entropy-meter`, `entropy-track`, `entropy-bar`.
- `entropy-bar` usa box-shadow y glow cuando `score >= 80`.

## Accesibilidad y contraste
- Verificar contraste WCAG para texto principal (usar `--color-text` sobre `--color-surface`).
- Todos los controles interactivos deben exponer focus visible (`:focus-visible`) y etiquetas ARIA.
- Preferir texto explicativo (hints) en `--color-text-muted` para no competir con la información principal.

---

Generado como guía rápida para mejorar el aspecto del cuadro. Usa las variables en `src/styles/global.css`.
