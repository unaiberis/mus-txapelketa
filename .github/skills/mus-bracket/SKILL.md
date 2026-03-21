---
name: mus-bracket
description: >
  Build a professional mus tournament bracket application using Astro 5 and Tailwind 4.
  Use this skill whenever the user asks to create a mus tournament, torneo de mus, bracket de mus,
  cuadro de eliminatorias para mus, or any tournament bracket for pair-based card games.
  Also trigger when the user wants to build any tournament bracket system in Astro with
  entropy-based randomization. The skill covers: pair entry UI, entropy collection (keystrokes,
  mouse, timing), preliminary round calculation for non-power-of-2 counts, and full bracket rendering.
---

# Mus Tournament Bracket — Skill

Builds a **single-page** Astro 5 + Tailwind 4 mus tournament bracket app.
Everything happens on one screen split into zones.

---

## Stack & Dependencies

```
astro@5          — web framework
@astrojs/react   — for interactive island
tailwindcss@4    — styling
@astrojs/tailwind — integration
```

No external bracket library is needed — the bracket is rendered via custom SVG/HTML for maximum control and professional look.

---

## App Architecture

```
src/
  pages/
    index.astro          — full-page layout, imports the island
  components/
    TournamentApp.tsx    — single React island (client:load), all logic here
```

All logic lives in `TournamentApp.tsx` as a React island. Astro is just the shell.

---

## Layout: Three Zones (full viewport, no scroll)

```
┌──────────────────────────────────────────────────────────┐
│  HEADER — Torneo de Mus  (h-14)                         │
├─────────────────┬────────────────────────────────────────┤
│  LEFT PANEL     │  RIGHT PANEL                           │
│  (w-72, fixed)  │  (flex-1, overflow-auto)               │
│                 │                                        │
│  Pair entry     │  Bracket / Tournament display          │
│  inputs +       │                                        │
│  list of pairs  │  Phase 1: Preliminary round (if needed)│
│                 │  Phase 2: Main bracket                 │
│  [Crear torneo] │                                        │
└─────────────────┴────────────────────────────────────────┘
```

CSS: `body { height: 100dvh; display: flex; flex-direction: column; overflow: hidden; }`

---

## Entropy Collection

Collect entropy BEFORE the user clicks "Crear torneo". Attach these listeners as soon as the component mounts:

```typescript
type EntropyEvent =
  | { t: 'k'; key: string; ts: number; dt: number }   // keydown
  | { t: 'm'; x: number; y: number; ts: number }       // mousemove (throttle 50ms)
  | { t: 'c'; x: number; y: number; ts: number }       // click
  | { t: 'c'; x: number; y: number; ts: number; last: true } // last click before submit

const entropy: EntropyEvent[] = [];
let lastKeyTs = 0;

document.addEventListener('keydown', (e) => {
  const now = Date.now();
  entropy.push({ t: 'k', key: e.key, ts: now, dt: now - lastKeyTs });
  lastKeyTs = now;
});

let lastMouseTs = 0;
document.addEventListener('mousemove', (e) => {
  const now = Date.now();
  if (now - lastMouseTs < 50) return;
  lastMouseTs = now;
  entropy.push({ t: 'm', x: e.clientX, y: e.clientY, ts: now });
});

document.addEventListener('click', (e) => {
  entropy.push({ t: 'c', x: e.clientX, y: e.clientY, ts: Date.now() });
});
```

---

### Entropy Level — UI Meter

Render an **Entropy Meter** widget inside the left panel, **above** the "Crear torneo" button.
It must be visible at all times during the entry phase, updating reactively as the user interacts.

#### Entropy Score Calculation

```typescript
// Tracked in React state, updated on every relevant event
const [entropyScore, setEntropyScore] = useState(0);

// Call this whenever entropy array grows
function computeEntropyScore(events: EntropyEvent[]): number {
  const mouseEvents = events.filter(e => e.t === 'm');
  const keyEvents   = events.filter(e => e.t === 'k');
  const clickEvents = events.filter(e => e.t === 'c');

  // Mouse contributes the most (continuous movement = high unpredictability)
  // Weighted: mouse 60%, keys 30%, clicks 10%
  // Score goes 0–100

  // Mouse: measure path variance (total distance traveled, capped)
  let mouseDist = 0;
  for (let i = 1; i < mouseEvents.length; i++) {
    const dx = mouseEvents[i].x - mouseEvents[i-1].x;
    const dy = mouseEvents[i].y - mouseEvents[i-1].y;
    mouseDist += Math.sqrt(dx*dx + dy*dy);
  }
  const mouseScore = Math.min(60, (mouseDist / 5000) * 60);   // saturates at ~5000px traveled

  // Keys: unique keys typed, timing variance
  const uniqueKeys = new Set(keyEvents.map(e => e.key)).size;
  const keyScore = Math.min(30, (uniqueKeys / 15) * 30);       // saturates at 15 unique keys

  // Clicks: diminishing returns
  const clickScore = Math.min(10, clickEvents.length * 2);

  return Math.round(mouseScore + keyScore + clickScore);        // 0–100
}
```

Update `entropyScore` via state on every mousemove (throttled) and keydown:

```typescript
// Inside the mousemove listener (after pushing to entropy array):
setEntropyScore(computeEntropyScore(entropyRef.current));
```

Use a `ref` for the entropy array (so listeners don't capture stale closures) and `useState` for the score (so the meter re-renders).

#### Meter Labels

Map score → label:

| Score | Label | Bar color |
|-------|-------|-----------|
| 0–19  | Sin aleatoriedad | Red `#ef4444` |
| 20–39 | Baja | Orange `#f97316` |
| 40–59 | Media | Yellow `#eab308` |
| 60–79 | Alta | Lime `#84cc16` |
| 80–99 | Muy alta | Green `#22c55e` |
| 100   | Máxima — ¡Perfecto! | Emerald + pulse glow `#10b981` |

#### Meter HTML Structure

```tsx
function EntropyMeter({ score }: { score: number }) {
  const label =
    score >= 100 ? '¡Aleatoriedad máxima!' :
    score >= 80  ? 'Aleatoriedad muy alta' :
    score >= 60  ? 'Aleatoriedad alta' :
    score >= 40  ? 'Aleatoriedad media' :
    score >= 20  ? 'Aleatoriedad baja' :
                   'Mueve el ratón para aumentar';

  const barColor =
    score >= 100 ? '#10b981' :
    score >= 80  ? '#22c55e' :
    score >= 60  ? '#84cc16' :
    score >= 40  ? '#eab308' :
    score >= 20  ? '#f97316' :
                   '#ef4444';

  return (
    <div className="entropy-meter">
      {/* Header row */}
      <div className="entropy-header">
        <span className="entropy-title">🎲 Nivel de aleatoriedad</span>
        <span className="entropy-pct">{score}%</span>
      </div>

      {/* Bar track */}
      <div className="entropy-track">
        <div
          className="entropy-bar"
          style={{
            width: `${score}%`,
            backgroundColor: barColor,
            boxShadow: score >= 80 ? `0 0 8px ${barColor}` : 'none',
            transition: 'width 0.3s ease, background-color 0.5s ease, box-shadow 0.5s ease',
          }}
        />
      </div>

      {/* Status label */}
      <p className="entropy-label">{label}</p>

      {/* Hint — only show when score < 60 */}
      {score < 60 && (
        <p className="entropy-hint">
          Mueve el ratón por la pantalla para un sorteo más seguro
        </p>
      )}

      {/* Shield icon when score >= 80 */}
      {score >= 80 && (
        <p className="entropy-secure">🛡 Sorteo seguro</p>
      )}
    </div>
  );
}
```

#### Meter Styles

The meter must be styled to match the overall aesthetic chosen. Key rules:

```css
.entropy-meter {
  /* Inset card inside the left panel — slightly different surface color */
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.entropy-track {
  height: 8px;
  background: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
  margin: 6px 0;
}

.entropy-bar {
  height: 100%;
  border-radius: 4px;
  /* transition applied inline above */
}

.entropy-title { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); }
.entropy-pct   { font-family: var(--font-display); font-size: 1.1rem; color: var(--color-text); }
.entropy-label { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px; }
.entropy-hint  { font-size: 0.7rem; color: var(--color-text-muted); opacity: 0.7; font-style: italic; }
.entropy-secure{ font-size: 0.75rem; color: #22c55e; margin-top: 4px; }
```

When score reaches 100, add a CSS `@keyframes pulse-glow` animation on the bar and display a brief celebration (e.g., the bar shimmers).

#### UX Behaviour

- The meter is **always visible** in the left panel during the entry phase — it's not hidden or collapsed.
- The "Crear torneo" button **does NOT require** a minimum entropy score — the user can create the tournament at any point, but the meter encourages them to move the mouse first.
- Once the tournament is generated, the meter is **replaced** by the seed display (`Seed: #3f2a91b`) and a lock icon — it no longer needs to update.
- The meter **does not reset** if the user adds/removes pairs — entropy accumulates over the whole session.

---

### Entropy → Seed

When the user clicks "Crear torneo", mark the last click as `last: true`, then derive a numeric seed:

```typescript
function deriveSeed(events: EntropyEvent[]): number {
  // Build a string from all events and XOR-hash it
  const raw = JSON.stringify(events);
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  // Combine with performance.now() for extra jitter
  return Math.abs(hash ^ (performance.now() * 1000 | 0));
}
```

### Seeded PRNG (Mulberry32)

```typescript
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

---

## Tournament Math: Preliminary Round

For `n` pairs, find the next power of 2 ≥ n, call it `target`.

```typescript
function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function preliminaryInfo(n: number) {
  const target = nextPow2(n);
  if (target === n) return { prelimCount: 0, prelimPairs: 0, byePairs: n };
  // pairs that need to play a prelim: excess = n - target/2
  // those pairs play each other to reduce to target/2, then join the rest
  const byeCount = target - n;           // pairs that go straight to main bracket
  const prelimPairs = n - byeCount;      // pairs in the prelim round (always even)
  return { target, byeCount, prelimPairs, prelimMatches: prelimPairs / 2 };
}
```

**Example (80 pairs):**
- `target = 128`… wait, re-check: nextPow2(80) = 128. byeCount = 128 - 80 = 48. prelimPairs = 80 - 48 = 32. prelimMatches = 16. After prelim 16 advance + 48 byes = 64. ✓

Show this calculation visually in the UI before rendering the bracket.

---

## Match Format (Best-of)

Before generating the bracket, the user selects a **best-of format**. This is stored in tournament state and used to validate all match results.

### Format Selection UI

Show a compact selector in the left panel, **between the pair list and the "Crear torneo" button**:

```
Formato de partida
[ Al mejor de: ] [ 5 ▼ ] partidas
                  3
                  5  ← default
                  7
                  9
                  Personalizado...
```

For "Personalizado", show a number input (min 1, must be odd — mus is always first-to-win, best-of-N requires N to be odd for a decisive winner). Validate:

```typescript
function isValidBestOf(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n % 2 === 1;
}
```

The selected format is shown as a badge on every match card and stored in state: `bestOf: number`.

### Win Condition

```typescript
const winsNeeded = Math.ceil(bestOf / 2);   // e.g. bestOf=5 → winsNeeded=3

// A match result score1-score2 is valid when:
// - Both scores are non-negative integers
// - max(score1, score2) === winsNeeded        (winner has exactly winsNeeded wins)
// - min(score1, score2) < winsNeeded          (loser has not also reached winsNeeded)
// - score1 + score2 <= bestOf                 (total games ≤ bestOf)

function isValidScore(score1: number, score2: number, bestOf: number): boolean {
  const winsNeeded = Math.ceil(bestOf / 2);
  const maxScore = Math.max(score1, score2);
  const minScore = Math.min(score1, score2);
  return (
    Number.isInteger(score1) && score1 >= 0 &&
    Number.isInteger(score2) && score2 >= 0 &&
    maxScore === winsNeeded &&
    minScore < winsNeeded &&
    score1 + score2 <= bestOf
  );
}
```

**Valid examples for best-of-5 (winsNeeded=3):**
- ✅ `3-0`, `3-1`, `3-2`
- ❌ `3-3` (tie impossible), `4-1` (4 > winsNeeded), `2-1` (nobody reached 3)

**Valid examples for best-of-7 (winsNeeded=4):**
- ✅ `4-0`, `4-1`, `4-2`, `4-3`
- ❌ `3-2`, `5-2`, `4-4`

---

## Tournament State Machine

```typescript
type Phase = 'entry' | 'generated' | 'inProgress' | 'finished';

interface MatchScore {
  score1: number;   // wins for pair1
  score2: number;   // wins for pair2
}

interface Match {
  id: string;
  pair1: string | null;     // null = BYE
  pair2: string | null;
  score?: MatchScore;       // set when result is registered
  winner?: string;          // derived from score (or auto-set for BYE)
  round: number;
  isPrelim: boolean;
}

interface TournamentState {
  phase: Phase;
  pairs: string[];           // entered pairs
  shuffled: string[];        // after seeded shuffle
  bestOf: number;            // e.g. 5, 7, 9 — locked once bracket is generated
  prelim: Match[];           // preliminary matches (may be empty)
  rounds: Match[][];         // main bracket rounds[0] = R1, etc.
  seed: number;
}
```

`bestOf` is **locked** once "Crear torneo" is clicked — it cannot be changed mid-tournament.
Display it as a prominent locked badge in the header once the tournament starts: `🔒 Al mejor de 5`.

### Bracket Generation

1. Shuffle pairs with seeded PRNG.
2. Assign `byeCount` pairs to BYE slots (auto-win, `score` left undefined, `winner` set immediately).
3. Remaining `prelimPairs` pairs are matched into preliminary matches.
4. After prelims, winners + BYE pairs fill R1 of main bracket.
5. Build subsequent rounds as empty match slots (filled as winners advance).

---

## Bracket Rendering

### Preliminary Round Display

Show as a compact grid of cards:
```
╔══════════════════════╗
║  FASE PREVIA (16 partidas) ║
║  32 parejas eliminan a 16  ║
╚══════════════════════╝

[Pareja A  vs  Pareja B]  [Pareja C  vs  Pareja D]  ...
```

### Main Bracket

Render as a **horizontal elimination tree** using flexbox columns:

```
Round 1      Round 2      Semis        Final       Campeón
[A vs B]  ─┐
            ├─ [winner vs winner] ─┐
[C vs D]  ─┘                       ├─ [...]
                                   │
[E vs F]  ─┐                       ├─ [CAMPEÓN]
            ├─ [...]             ──┘
[G vs H]  ─┘
```

Implementation using CSS columns + connecting lines via `::before`/`::after` pseudo-elements or inline SVG overlay.

### Match Card Component

Each card has three states:

1. **Pending** — waiting for result input
2. **Active** — score inputs visible, submit enabled
3. **Completed** — shows result, winner highlighted, loser dimmed

```tsx
function MatchCard({
  match,
  bestOf,
  onResult,
}: {
  match: Match;
  bestOf: number;
  onResult: (matchId: string, score1: number, score2: number) => void;
}) {
  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const winsNeeded = Math.ceil(bestOf / 2);
  const isBye = match.pair1 === null || match.pair2 === null;
  const isDone = !!match.winner;

  function handleSubmit() {
    const n1 = parseInt(s1), n2 = parseInt(s2);
    if (!isValidScore(n1, n2, bestOf)) {
      setError(`Resultado inválido. Al mejor de ${bestOf}: el ganador debe tener ${winsNeeded} victorias.`);
      return;
    }
    setError('');
    setEditing(false);
    onResult(match.id, n1, n2);
  }

  if (isBye) {
    // BYE card — show auto-advance, no score
    const activePair = match.pair1 ?? match.pair2;
    return (
      <div className="match-card match-card--bye">
        <span className="pair winner">{activePair}</span>
        <span className="vs-label">BYE</span>
        <span className="pair bye-opponent">—</span>
      </div>
    );
  }

  if (isDone && !editing) {
    // Completed card
    const p1won = match.winner === match.pair1;
    return (
      <div className="match-card match-card--done">
        <span className={`pair ${p1won ? 'winner' : 'loser'}`}>
          {match.pair1}
          <em className="score">{match.score!.score1}</em>
        </span>
        <span className="vs-label">VS</span>
        <span className={`pair ${!p1won ? 'winner' : 'loser'}`}>
          {match.pair2}
          <em className="score">{match.score!.score2}</em>
        </span>
        <button className="btn-edit" onClick={() => setEditing(true)}>✏️</button>
      </div>
    );
  }

  // Pending / editing card
  return (
    <div className="match-card match-card--active">
      <div className="pair-row">
        <span className="pair-name">{match.pair1}</span>
        <input
          type="number" min={0} max={winsNeeded}
          value={s1} onChange={e => setS1(e.target.value)}
          placeholder="0" className="score-input"
        />
      </div>
      <span className="vs-label">VS</span>
      <div className="pair-row">
        <span className="pair-name">{match.pair2}</span>
        <input
          type="number" min={0} max={winsNeeded}
          value={s2} onChange={e => setS2(e.target.value)}
          placeholder="0" className="score-input"
        />
      </div>
      {error && <p className="score-error">{error}</p>}
      <button
        className="btn-confirm"
        onClick={handleSubmit}
        disabled={s1 === '' || s2 === ''}
      >
        Confirmar resultado
      </button>
    </div>
  );
}
```

### Result Registration Logic

```typescript
function registerResult(
  state: TournamentState,
  matchId: string,
  score1: number,
  score2: number
): TournamentState {
  // Validate
  if (!isValidScore(score1, score2, state.bestOf)) {
    throw new Error('Resultado inválido');
  }

  const winner = score1 > score2
    ? (findMatch(state, matchId)!.pair1!)
    : (findMatch(state, matchId)!.pair2!);

  const score: MatchScore = { score1, score2 };

  // Update match in prelim or rounds
  const newState = updateMatchInState(state, matchId, { score, winner });

  // Propagate winner to next match slot
  return propagateWinner(newState, matchId, winner);
}
```

**Score correction**: allow re-editing a completed match (the ✏️ button). Re-editing cascades — it clears all dependent matches downstream in the bracket (winner slots that were already filled from this match become `undefined` again, requiring re-entry).

```typescript
function clearDownstream(state: TournamentState, matchId: string): TournamentState {
  // Find the next match that has this match's winner as a participant
  // Set that participant back to undefined and recursively clear further downstream
  // This ensures bracket integrity when a result is corrected
}
```

### Score Display on Completed Cards

Completed match cards show the result prominently:

```
┌─────────────────────────────┐
│  Pareja A            3  ✓  │  ← winner row, accented color
│     VS                      │
│  Pareja B            1  ✗  │  ← loser row, dimmed
│                      ✏️    │  ← edit button bottom-right
└─────────────────────────────┘
```

The score numbers use the display font, larger size, and the accent color for the winner's score.
Show the format badge on each completed card: `(M.d.5)` or `(M.d.7)`.

Auto-advance BYE matches on generation (no score stored, `winner` set directly).

---

## Left Panel: Pair Entry

```tsx
// State
const [input1, setInput1] = useState('');
const [input2, setInput2] = useState('');
const [pairs, setPairs] = useState<string[]>([]);

// Add pair
function addPair() {
  const name = `${input1.trim()} / ${input2.trim()}`;
  if (input1.trim() && input2.trim() && !pairs.includes(name)) {
    setPairs(prev => [...prev, name]);
    setInput1(''); setInput2('');
    // focus back to first input
  }
}

// Enter key on second input → addPair
// Show pair count and preliminary info live below the list
```

Show live feedback:
```
12 parejas registradas
→ Se necesita ronda previa: 4 partidas (8 parejas)
→ 4 parejas pasan directamente a cuadro principal (64)
```

Min pairs: 2. Warn if odd number (mus is always pairs vs pairs).

---

## Fees & Prizes

### Data Model

Add to `TournamentState`:

```typescript
interface PrizeConfig {
  entryFee: number;          // € per pair — 0 means free
  currency: string;          // default 'EUR', shown as symbol
  prizes: [
    number,   // 1st place
    number,   // 2nd place
    number,   // 3rd place
    number,   // 4th place
  ];
  prizeMode: 'manual' | 'auto';  // see below
}

// Inside TournamentState:
prizeConfig: PrizeConfig;
```

Default values:
```typescript
const defaultPrizeConfig: PrizeConfig = {
  entryFee: 0,
  currency: 'EUR',
  prizes: [0, 0, 0, 0],
  prizeMode: 'manual',
};
```

`prizeConfig` is **editable before the bracket is generated** and **locked afterwards** (same as `bestOf`). It is included in the export payload and covered by the cryptographic signature — results and prize money cannot be tampered with independently.

---

### Prize Auto-distribution

When `prizeMode === 'auto'`, calculate prize pool from the entry fee and distribute automatically using a configurable split. The user picks the split percentages (must sum to 100):

```typescript
const AUTO_SPLITS = [
  { label: '50 / 30 / 15 / 5',   pcts: [50, 30, 15, 5]  },  // default
  { label: '40 / 30 / 20 / 10',  pcts: [40, 30, 20, 10] },
  { label: '60 / 25 / 10 / 5',   pcts: [60, 25, 10, 5]  },
  { label: 'Personalizado',       pcts: null               },  // 4 free inputs
];

function computeAutoPrizes(
  entryFee: number,
  pairCount: number,
  pcts: [number, number, number, number]
): [number, number, number, number] {
  const pool = entryFee * pairCount;
  return pcts.map(p => Math.floor((pool * p) / 100)) as [number, number, number, number];
  // Note: floor to avoid fractional euros. Show leftover (pool - sum) as "Bote restante" if any.
}
```

When `prizeMode === 'manual'`, the four prize inputs are free — no constraint.

**Validation**: in auto mode, show a live preview of the prize pool and the distribution before generating the bracket. In manual mode, warn (but don't block) if `sum(prizes) > entryFee * pairCount` — this means the organizer is adding money from outside the pool, which is valid but worth flagging.

---

### Left Panel: Fees & Prizes UI

Add a collapsible **"💰 Inscripción y premios"** section in the left panel, between the pair list info and the format selector:

```
┌─────────────────────────────────────┐
│  💰 Inscripción y premios      [▼]  │
├─────────────────────────────────────┤
│  Cuota por pareja: [____] €         │
│                                     │
│  Distribución de premios:           │
│  ○ Automática  ● Manual             │
│                                     │
│  [Auto split: 50/30/15/5  ▼]       │  ← only if auto
│                                     │
│  🥇 1er premio:  [________] €       │
│  🥈 2º premio:   [________] €       │
│  🥉 3er premio:  [________] €       │
│  🏅 4º premio:   [________] €       │
│                                     │
│  Bote total: 1.200 €                │
│  Distribuido: 1.200 €  ✓            │  ← green if balanced
│  Sobrante: 0 €                      │
└─────────────────────────────────────┘
```

Live update: as soon as `entryFee` or `pairCount` changes in auto mode, recompute and update the four prize inputs.

Currency symbol: show `€` by default. Allow changing it (a small `[€]` button opens a tiny dropdown: €, $, £, ¥, custom). Store as `currency` string in state.

---

### Podium Display

Once the tournament finishes (the final match has a winner), **replace the bracket area with a Podium view** (or show it above the bracket as a summary panel):

```
┌─────────────────────────────────────────────────┐
│              🏆  CAMPEONES DEL TORNEO            │
├─────────┬─────────────────┬─────────────────────┤
│   🥇    │   Pareja A      │   450 €             │
│   🥈    │   Pareja B      │   270 €             │
│   🥉    │   Pareja C      │   135 €             │  ← losers of semis
│   🏅    │   Pareja D      │    45 €             │  ← other semi loser
└─────────┴─────────────────┴─────────────────────┘
│  Bote total repartido: 900 €  |  Seed: #3f2a91b │
└─────────────────────────────────────────────────┘
```

3rd and 4th place are the two semi-final losers. They **share** the same prize (both get the 3rd prize amount, or it can be split — the simplest model is: 3rd prize goes to one semi loser, 4th prize to the other, both listed). Make this configurable:

```typescript
thirdPlaceShared: boolean;  // default false — separate 3rd/4th prizes
// if true: both semi losers get Math.floor((prize3 + prize4) / 2)
```

If `entryFee === 0` and all prizes are `0`, hide the prize column in the podium entirely — show just the rankings.

**Podium animation**: reveal each row with a staggered animation (4th → 3rd → 2nd → 1st), with the 1st place row getting the most dramatic entrance (scale-up + glow).

---

### Semi-final Loser Tracking

To award 3rd/4th place, track semi-final losers in state:

```typescript
interface TournamentState {
  // ... existing fields ...
  prizeConfig: PrizeConfig;
  podium?: {
    first: string;
    second: string;
    third: string;      // semi loser A
    fourth: string;     // semi loser B
  };
}
```

The semi-final round is `rounds[rounds.length - 2]` (second-to-last round). When both semi-final matches have a winner, extract the losers and populate `podium.third` / `podium.fourth`.

When the final match completes, set `podium.first` and `podium.second`, set `phase = 'finished'`, and trigger the podium reveal animation.

---

### Export: Fees & Prizes

`prizeConfig` and `podium` are included in the export payload (all three formats) and covered by the HMAC signature. In the Excel export, add a third sheet **"Premios"**:

| Campo | Valor |
|-------|-------|
| Cuota por pareja | 15 € |
| Bote total | 900 € |
| 1er premio | 450 € — Pareja A |
| 2º premio | 270 € — Pareja B |
| 3er premio | 135 € — Pareja C |
| 4º premio | 45 € — Pareja D |

In the CSV, add `#META` rows for each prize field.

---



This app requires **production-grade, distinctive aesthetics** — not generic AI output.
Apply the full frontend-design methodology below before writing any CSS.

### Design Thinking (do this first)

Before writing a single line of CSS, commit to a **BOLD aesthetic direction**:

- **Purpose**: Tournament management for mus players — competitive, social, high-stakes feel.
- **Tone**: Pick ONE extreme and execute it with precision. Good directions for this context:
  - *Casino noir* — deep greens, gold foil, Art Deco geometry, felt texture
  - *Brutalist scoreboard* — raw monospace, harsh borders, neon on black, stadium energy
  - *Luxury card club* — cream + deep burgundy, serif display type, refined spacing
  - *Retro arcade* — pixelated fonts, scanlines, CRT glow, phosphor green
  - Choose any direction but **commit fully**. No hedging between styles.
- **Differentiation**: What's the ONE thing someone will remember? (e.g., a glowing bracket tree, a felt texture panel, animated match connections)

**CRITICAL**: Generic "dark dashboard" aesthetics are not acceptable. The design must feel like it was made *specifically* for mus tournaments, not a generic sports app.

### Typography Rules

- **Display / headings**: A characterful, unexpected font — NOT Inter, NOT Roboto, NOT Arial.
  - Good choices: `Bebas Neue`, `Playfair Display`, `Press Start 2P`, `Cormorant Garamond`, `Anton`, `Archivo Black`, `Bodoni Moda`
  - Import from Google Fonts in `index.astro`
- **Body / UI**: A refined companion font that contrasts with the display choice
- Pair with intention — the contrast between display and body IS part of the design

### Color & Theme Rules

- Use CSS variables for ALL colors, defined in `@theme {}` (Tailwind 4) or `:root`
- Dominant dark background + ONE sharp accent color outperforms balanced palettes
- The accent color must feel intentional for the context (green felt, gold card back, neon phosphor, etc.)
- Example palettes to adapt (don't copy literally — make it yours):
  ```css
  /* Casino noir */
  --bg: #0a0f0d; --surface: #111a14; --accent: #c9a84c; --text: #e8e0d0;

  /* Brutalist arena */
  --bg: #0d0d0d; --surface: #1a1a1a; --accent: #39ff14; --text: #ffffff;

  /* Luxury club */
  --bg: #1a0a0a; --surface: #2a1515; --accent: #d4af37; --text: #f5f0e8;
  ```

### Motion & Micro-interactions

- **Page load**: Staggered reveal of panels (left panel slides in, bracket fades in with delay)
- **Match cards**: Hover state with lift + glow on the accent color
- **Winner selection**: Winning team gets a brief flash animation; loser fades/dims
- **Bracket propagation**: When a winner advances, the next match slot animates in
- **Bracket lines**: Connecting lines animate in after bracket is generated (CSS `stroke-dashoffset` or `scaleX` reveal)
- Use CSS transitions/animations; Motion library if available in the React island

### Spatial Composition

- The left panel should feel like a **sidebar instrument** — dense but controlled
- The bracket area should feel **expansive** — generous horizontal space, breathing room between rounds
- Header: bold typographic statement, not a generic nav bar
- Consider: diagonal accent elements, overlapping card shadows, bracket lines with glow effects

### Backgrounds & Texture

- Avoid plain solid backgrounds — add depth:
  - Felt texture: subtle `background-image: repeating-linear-gradient(...)` or CSS noise
  - Vignette: `radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.6) 100%)`
  - Grain: SVG `feTurbulence` filter or CSS `noise` overlay at low opacity
  - Geometric pattern: suit symbols (♠ ♥ ♦ ♣) as faint watermark pattern in bracket area

### What NOT to do

- ❌ Generic purple-on-white gradient
- ❌ Inter or Roboto as display font
- ❌ Flat, textureless dark surfaces with no depth
- ❌ Default Tailwind blue as accent
- ❌ Cookie-cutter card components with no personality
- ❌ The same aesthetic as any other sports/tournament app

### Suggested Baseline (adapt freely)

```css
/* This is a STARTING POINT — transform it into something memorable */
@theme {
  --color-bg: #0a0f0d;
  --color-surface: #111a14;
  --color-surface2: #1a2b1e;
  --color-accent: #c9a84c;       /* gold felt */
  --color-accent-glow: rgba(201,168,76,0.3);
  --color-text: #e8e0d0;
  --color-text-muted: #6b7c6f;
  --color-border: #2a3d2e;
  --color-winner: #1a3a1a;
  --color-winner-text: #7ddb7d;
  --color-loser: #2a1515;
  --color-loser-text: #6b4a4a;
}
```

---

## Astro Page Setup

```astro
---
// src/pages/index.astro
---
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Torneo de Mus</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
</head>
<body class="bg-[#0f1117] text-slate-100 h-dvh flex flex-col overflow-hidden">
  <TournamentApp client:load />
</body>
</html>
```

---

## Tailwind 4 Notes

- Import via `@import "tailwindcss"` in global CSS (no config file needed in v4)
- Use CSS variables for custom colors in `@theme {}` block
- Arbitrary values `bg-[#0f1117]` work the same as v3
- No `content` array needed in v4 — it auto-detects template files

---

## Export / Import with Cryptographic Integrity

Once a tournament is generated, the user can **export** the full state to a file and later **import** it to resume. Files are cryptographically signed so any tampering is detected on import and rejected.

No server is needed — everything uses the **Web Crypto API** (`window.crypto.subtle`), available in all modern browsers.

---

### Supported Formats

Offer three export formats via a dropdown or button group:

| Format | Use case |
|--------|----------|
| **JSON** | Machine-readable, lossless, default |
| **CSV** | Human-readable spreadsheet (matches only, no bracket structure) |
| **Excel (.xlsx)** | Import via `xlsx` npm package (`SheetJS`), two sheets: Matches + Metadata |

Install: `npm install xlsx` (SheetJS community edition — no license issues for this use).

---

### Cryptographic Signing — Web Crypto HMAC-SHA256

Use **HMAC-SHA256** with a deterministic key derived from the tournament seed.
This is symmetric (same key signs and verifies) which is fine here — the goal is to prevent casual tampering, not adversarial attacks.

#### Key derivation

```typescript
// Derive a signing key from the tournament seed (no user password needed)
async function deriveSigningKey(seed: number): Promise<CryptoKey> {
  const seedBytes = new TextEncoder().encode(`mus-bracket-${seed}`);
  const rawKey = await crypto.subtle.digest('SHA-256', seedBytes);
  return crypto.subtle.importKey(
    'raw', rawKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,           // not extractable
    ['sign', 'verify']
  );
}
```

#### What gets signed

Build a **canonical payload** — a deterministic JSON string of the tournament data (no whitespace, keys sorted). Sign ONLY the canonical payload, not the full file (which includes the signature itself).

```typescript
interface TournamentExport {
  version: '1';
  exportedAt: string;        // ISO timestamp
  seed: number;
  bestOf: number;            // locked format — e.g. 5, 7, 9
  pairs: string[];
  shuffled: string[];
  prelim: Match[];           // includes score + winner per match
  rounds: Match[][];         // includes score + winner per match
  phase: Phase;
  // --- added on export, verified on import ---
  signature: string;         // hex-encoded HMAC-SHA256
}

function canonicalize(data: Omit<TournamentExport, 'signature'>): string {
  // Deterministic serialization: sort keys recursively
  return JSON.stringify(data, Object.keys(data).sort());
}

async function signExport(state: TournamentState): Promise<TournamentExport> {
  const payload: Omit<TournamentExport, 'signature'> = {
    version: '1',
    exportedAt: new Date().toISOString(),
    seed: state.seed,
    pairs: state.pairs,
    shuffled: state.shuffled,
    prelim: state.prelim,
    rounds: state.rounds,
    phase: state.phase,
  };
  const key = await deriveSigningKey(state.seed);
  const canonical = canonicalize(payload);
  const sigBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(canonical)
  );
  const signature = Array.from(new Uint8Array(sigBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return { ...payload, signature };
}
```

#### Verification on import

```typescript
async function verifyAndImport(raw: string): Promise<TournamentState> {
  let parsed: TournamentExport;
  try { parsed = JSON.parse(raw); }
  catch { throw new Error('Archivo inválido — no es JSON válido'); }

  if (parsed.version !== '1') throw new Error('Versión de archivo no compatible');

  const { signature, ...payload } = parsed;
  const key = await deriveSigningKey(payload.seed);
  const canonical = canonicalize(payload);

  const sigBytes = new Uint8Array(
    signature.match(/.{2}/g)!.map(h => parseInt(h, 16))
  );
  const valid = await crypto.subtle.verify(
    'HMAC', key,
    sigBytes,
    new TextEncoder().encode(canonical)
  );

  if (!valid) {
    throw new Error(
      '⚠️ Firma inválida — el archivo ha sido modificado y no puede importarse'
    );
  }

  // Reconstruct state from verified payload
  return {
    phase: payload.phase,
    pairs: payload.pairs,
    shuffled: payload.shuffled,
    prelim: payload.prelim,
    rounds: payload.rounds,
    seed: payload.seed,
  };
}
```

---

### Export Functions

#### JSON export

```typescript
function exportJSON(signed: TournamentExport) {
  const blob = new Blob([JSON.stringify(signed, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `torneo-mus-${Date.now()}.json`);
}
```

#### CSV export

CSV stores match data in a flat table. The signature is embedded as a special row so it travels with the file.

```typescript
function exportCSV(signed: TournamentExport) {
  const rows: string[][] = [];
  rows.push(['fase', 'ronda', 'partida', 'pareja1', 'pareja2', 'score1', 'score2', 'ganador']);

  signed.prelim.forEach((m, i) =>
    rows.push([
      'previa', '0', String(i+1),
      m.pair1 ?? 'BYE', m.pair2 ?? 'BYE',
      String(m.score?.score1 ?? ''), String(m.score?.score2 ?? ''),
      m.winner ?? ''
    ])
  );
  signed.rounds.forEach((round, r) =>
    round.forEach((m, i) =>
      rows.push([
        'principal', String(r+1), String(i+1),
        m.pair1 ?? 'BYE', m.pair2 ?? 'BYE',
        String(m.score?.score1 ?? ''), String(m.score?.score2 ?? ''),
        m.winner ?? ''
      ])
    )
  );

  // Append metadata + signature as comment rows
  rows.push(['#META', 'version', signed.version, '', '', '', '', '']);
  rows.push(['#META', 'seed', String(signed.seed), '', '', '', '', '']);
  rows.push(['#META', 'bestOf', String(signed.bestOf), '', '', '', '', '']);
  rows.push(['#META', 'exportedAt', signed.exportedAt, '', '', '', '', '']);
  rows.push(['#META', 'pairs', JSON.stringify(signed.pairs), '', '', '', '', '']);
  rows.push(['#META', 'shuffled', JSON.stringify(signed.shuffled), '', '', '', '', '']);
  rows.push(['#SIG', signed.signature, '', '', '', '', '', '']);

  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `torneo-mus-${Date.now()}.csv`);
}
```

CSV import: parse rows, reconstruct the JSON payload from `#META` rows + match table, extract `#SIG` row, then run `verifyAndImport` on the reconstructed JSON string.

#### Excel (.xlsx) export

Use SheetJS to create a workbook with two sheets:

```typescript
import * as XLSX from 'xlsx';

function exportXLSX(signed: TournamentExport) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Matches — includes score columns
  const matchRows = [
    ['Fase', 'Ronda', 'Partida', 'Pareja 1', 'Pareja 2', 'Victorias P1', 'Victorias P2', 'Ganador'],
    ...signed.prelim.map((m, i) =>
      ['Previa', 0, i+1, m.pair1 ?? 'BYE', m.pair2 ?? 'BYE',
       m.score?.score1 ?? '', m.score?.score2 ?? '', m.winner ?? '']
    ),
    ...signed.rounds.flatMap((round, r) =>
      round.map((m, i) =>
        [`Ronda ${r+1}`, r+1, i+1, m.pair1 ?? 'BYE', m.pair2 ?? 'BYE',
         m.score?.score1 ?? '', m.score?.score2 ?? '', m.winner ?? '']
      )
    ),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(matchRows), 'Partidas');

  // Sheet 2: Metadata + signature
  const metaRows = [
    ['Campo', 'Valor'],
    ['version', signed.version],
    ['seed', signed.seed],
    ['bestOf', signed.bestOf],
    ['exportedAt', signed.exportedAt],
    ['pairs', JSON.stringify(signed.pairs)],
    ['shuffled', JSON.stringify(signed.shuffled)],
    ['phase', signed.phase],
    ['signature', signed.signature],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(metaRows), 'Metadatos');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  downloadBlob(
    new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `torneo-mus-${Date.now()}.xlsx`
  );
}
```

#### Shared download helper

```typescript
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
```

---

### Import UI

Add an **import button** to the left panel (visible at all times, even before a tournament is active).
On click, open a `<input type="file" accept=".json,.csv,.xlsx">` picker.

```typescript
async function handleImport(file: File) {
  setImportError(null);
  try {
    let state: TournamentState;

    if (file.name.endsWith('.xlsx')) {
      state = await importXLSX(file);
    } else if (file.name.endsWith('.csv')) {
      const text = await file.text();
      state = await importCSV(text);
    } else {
      const text = await file.text();
      state = await verifyAndImport(text);    // JSON path
    }

    // Load verified state into app
    setTournamentState(state);
    setImportError(null);

  } catch (err: any) {
    setImportError(err.message ?? 'Error al importar el archivo');
  }
}
```

Show `importError` as a red alert banner below the import button when set.

---

### Export/Import UI Placement

In the left panel, add an **"Archivo"** section below the pair list and above the entropy meter:

```
┌──────────────────────────┐
│  [↑ Importar torneo]     │  — always visible
│  [↓ Exportar]  [JSON ▼]  │  — visible only when phase !== 'entry'
│  ⚠ Firma inválida...     │  — error, shown on bad import
└──────────────────────────┘
```

The export dropdown lets the user pick JSON / CSV / Excel before downloading.
Show a small **🔒 Firmado criptográficamente** badge next to the export button to communicate trust.

---

### Security Notes for the Skill User

- The signing key is derived from the tournament seed — whoever exported the file holds the implicit "key". This is **tamper-evident**, not tamper-proof against the original creator. That is the correct security model here: preventing third parties from editing results, not preventing the organizer themselves.
- The seed itself is never stored in a way that can be extracted post-generation (it's only in-memory React state and the export payload). An attacker who modifies the seed field in the file would invalidate their own signature — the verification would fail.
- For CSV and XLSX, the full serialized payload (including `pairs` and `shuffled` arrays as JSON strings in metadata rows) is what gets signed. Changing a single cell in the Excel file without updating the signature causes import to fail.
- Do NOT use `MD5` or `SHA-1` for the signature — HMAC-SHA256 only.

---

## Pairs-Only Export

Independent of the full tournament export, the user can export **just the pairs list** at any time — even before generating the bracket. This is useful to share the participant list, prepare seedings, or import pairs into another instance of the app.

### When available

The pairs-only export button is visible in the left panel **whenever `pairs.length >= 1`**, in both `entry` and post-generation phases. It is a separate, lighter action from the full tournament export.

### Format options

Pairs-only export also supports three formats via a small format picker:

| Format | Content |
|--------|---------|
| **JSON** | `{ version: 'pairs-1', exportedAt, pairs: string[] }` — no signature (no tournament data to protect) |
| **CSV** | One row per pair: `num, jugador1, jugador2` derived by splitting on ` / ` |
| **Excel** | Single sheet "Parejas" with columns: Nº, Jugador 1, Jugador 2 |

```typescript
// JSON pairs export — unsigned, lightweight
function exportPairsJSON(pairs: string[]) {
  const data = {
    version: 'pairs-1',
    exportedAt: new Date().toISOString(),
    pairs,
  };
  downloadBlob(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    `parejas-mus-${Date.now()}.json`
  );
}

// CSV pairs export
function exportPairsCSV(pairs: string[]) {
  const rows = [
    ['Nº', 'Jugador 1', 'Jugador 2'],
    ...pairs.map((p, i) => {
      const [j1, j2] = p.split(' / ');
      return [String(i + 1), j1 ?? p, j2 ?? ''];
    }),
  ];
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `parejas-mus-${Date.now()}.csv`);
}

// Excel pairs export
function exportPairsXLSX(pairs: string[]) {
  const rows = [
    ['Nº', 'Jugador 1', 'Jugador 2'],
    ...pairs.map((p, i) => {
      const [j1, j2] = p.split(' / ');
      return [i + 1, j1 ?? p, j2 ?? ''];
    }),
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Parejas');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  downloadBlob(
    new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `parejas-mus-${Date.now()}.xlsx`
  );
}
```

### Pairs-only import

Importing a pairs-only file (detected by `version === 'pairs-1'` for JSON, or by absence of `#SIG` for CSV/XLSX) **only loads the pairs list**, not a full tournament. It:
- Merges or replaces the current pairs list (ask the user: *"¿Añadir a las parejas existentes o reemplazarlas?"*)
- Never touches `bestOf`, `prizeConfig`, bracket state, or entropy

### UI placement

In the left panel, add a secondary export row below the main export controls:

```
┌──────────────────────────────────────┐
│  [↓ Exportar torneo] [JSON ▼]  🔒   │  ← full export (signed)
│  [↓ Solo parejas]    [CSV ▼]         │  ← lightweight, unsigned
│  [↑ Importar]                        │
└──────────────────────────────────────┘
```

Label the full export with the 🔒 badge; the pairs-only export has none (it's explicitly unsigned and the user should understand it's just a list).

---

## Internacionalización (i18n)

The app supports multiple languages. The selected language is stored in React state and persisted in `localStorage` so it survives page reloads.

### Supported languages (initial set)

| Code | Language |
|------|----------|
| `es` | Español ← default |
| `eu` | Euskara (Basque) |
| `en` | English |
| `fr` | Français |

Add more as a flat entry in the translations object — no infrastructure changes needed.

### Architecture: inline translation object

No i18n library needed. Use a typed translation object directly in the component:

```typescript
type LangCode = 'es' | 'eu' | 'en' | 'fr';

interface Translations {
  // Header
  appTitle: string;
  // Left panel — pairs
  player1Placeholder: string;
  player2Placeholder: string;
  addPair: string;
  pairsRegistered: (n: number) => string;
  prelimNeeded: (matches: number, pairs: number) => string;
  directToMain: (n: number) => string;
  minPairsWarning: string;
  oddPairsWarning: string;
  // Format
  matchFormat: string;
  bestOfLabel: string;
  customBestOf: string;
  invalidBestOf: string;
  // Fees & prizes
  feesAndPrizes: string;
  entryFee: string;
  prizeDistribution: string;
  autoMode: string;
  manualMode: string;
  autoSplit: string;
  firstPrize: string;
  secondPrize: string;
  thirdPrize: string;
  fourthPrize: string;
  totalPool: string;
  distributed: string;
  remainder: string;
  // Entropy meter
  entropyTitle: string;
  entropyHint: string;
  entropySecure: string;
  entropyLabels: [string, string, string, string, string, string]; // 0–5 levels
  // Tournament actions
  createTournament: string;
  resetTournament: string;
  // Bracket
  prelimPhase: string;
  prelimDescription: (matches: number, pairs: number) => string;
  round: (n: number) => string;
  semiFinals: string;
  final: string;
  champion: string;
  bye: string;
  confirmResult: string;
  invalidScore: (winsNeeded: number, bestOf: number) => string;
  editResult: string;
  editWarning: string;
  // Export / Import
  exportTournament: string;
  exportPairsOnly: string;
  importFile: string;
  signedBadge: string;
  importError: string;
  mergeOrReplace: string;
  mergeOption: string;
  replaceOption: string;
  // Podium
  tournamentChampions: string;
  totalDistributed: string;
  // Errors
  fileInvalid: string;
  signatureInvalid: string;
  versionIncompat: string;
}

const translations: Record<LangCode, Translations> = {
  es: {
    appTitle: 'Torneo de Mus',
    player1Placeholder: 'Jugador 1',
    player2Placeholder: 'Jugador 2',
    addPair: 'Añadir pareja',
    pairsRegistered: (n) => `${n} pareja${n !== 1 ? 's' : ''} registrada${n !== 1 ? 's' : ''}`,
    prelimNeeded: (m, p) => `→ Ronda previa: ${m} partidas (${p} parejas)`,
    directToMain: (n) => `→ ${n} parejas pasan directamente al cuadro`,
    minPairsWarning: 'Se necesitan al menos 2 parejas',
    oddPairsWarning: 'El número de parejas es impar — revisa la lista',
    matchFormat: 'Formato de partida',
    bestOfLabel: 'Al mejor de',
    customBestOf: 'Personalizado…',
    invalidBestOf: 'Debe ser un número impar (1, 3, 5, 7…)',
    feesAndPrizes: '💰 Inscripción y premios',
    entryFee: 'Cuota por pareja',
    prizeDistribution: 'Distribución de premios',
    autoMode: 'Automática',
    manualMode: 'Manual',
    autoSplit: 'Reparto automático',
    firstPrize: '🥇 1er premio',
    secondPrize: '🥈 2º premio',
    thirdPrize: '🥉 3er premio',
    fourthPrize: '🏅 4º premio',
    totalPool: 'Bote total',
    distributed: 'Distribuido',
    remainder: 'Sobrante',
    entropyTitle: '🎲 Nivel de aleatoriedad',
    entropyHint: 'Mueve el ratón por la pantalla para un sorteo más seguro',
    entropySecure: '🛡 Sorteo seguro',
    entropyLabels: ['Sin aleatoriedad', 'Baja', 'Media', 'Alta', 'Muy alta', '¡Aleatoriedad máxima!'],
    createTournament: 'Crear torneo',
    resetTournament: 'Reiniciar torneo',
    prelimPhase: 'FASE PREVIA',
    prelimDescription: (m, p) => `${m} partidas • ${p} parejas se clasifican`,
    round: (n) => `Ronda ${n}`,
    semiFinals: 'Semifinales',
    final: 'Final',
    champion: 'CAMPEÓN',
    bye: 'BYE',
    confirmResult: 'Confirmar resultado',
    invalidScore: (w, b) => `Resultado inválido. Al mejor de ${b}: el ganador necesita ${w} victorias.`,
    editResult: '✏️ Editar',
    editWarning: 'Editar este resultado borrará los resultados dependientes. ¿Continuar?',
    exportTournament: '↓ Exportar torneo',
    exportPairsOnly: '↓ Solo parejas',
    importFile: '↑ Importar',
    signedBadge: '🔒 Firmado',
    importError: 'Error al importar',
    mergeOrReplace: '¿Qué hacer con las parejas existentes?',
    mergeOption: 'Añadir a las existentes',
    replaceOption: 'Reemplazar todas',
    tournamentChampions: '🏆 Campeones del Torneo',
    totalDistributed: 'Total repartido',
    fileInvalid: 'Archivo inválido — no es un formato reconocido',
    signatureInvalid: '⚠️ Firma inválida — el archivo ha sido modificado y no puede importarse',
    versionIncompat: 'Versión de archivo no compatible',
  },

  eu: {
    appTitle: 'Mus Txapelketa',
    player1Placeholder: '1. Jokalaria',
    player2Placeholder: '2. Jokalaria',
    addPair: 'Bikotea gehitu',
    pairsRegistered: (n) => `${n} bikote erregistratu`,
    prelimNeeded: (m, p) => `→ Aurreko kanporaketa: ${m} partida (${p} bikote)`,
    directToMain: (n) => `→ ${n} bikote zuzenean txandara`,
    minPairsWarning: 'Gutxienez 2 bikote behar dira',
    oddPairsWarning: 'Bikote kopurua bakoitia da — egiaztatu zerrenda',
    matchFormat: 'Partida formatua',
    bestOfLabel: 'Onenak',
    customBestOf: 'Pertsonalizatua…',
    invalidBestOf: 'Zenbaki bakoiti bat izan behar da (1, 3, 5, 7…)',
    feesAndPrizes: '💰 Kuota eta sariak',
    entryFee: 'Bikoteko kuota',
    prizeDistribution: 'Sarien banaketa',
    autoMode: 'Automatikoa',
    manualMode: 'Eskuzkoa',
    autoSplit: 'Banaketa automatikoa',
    firstPrize: '🥇 1. saria',
    secondPrize: '🥈 2. saria',
    thirdPrize: '🥉 3. saria',
    fourthPrize: '🏅 4. saria',
    totalPool: 'Sari-poltsa',
    distributed: 'Banatuta',
    remainder: 'Soberakina',
    entropyTitle: '🎲 Ausazko maila',
    entropyHint: 'Mugitu sagua pantailan zozketa seguruagoa izateko',
    entropySecure: '🛡 Zozketa segurua',
    entropyLabels: ['Ausazkorik gabe', 'Baxua', 'Ertaina', 'Altua', 'Oso altua', 'Ausazkotasun maximoa!'],
    createTournament: 'Txapelketa sortu',
    resetTournament: 'Berrabiarazi',
    prelimPhase: 'AURREKO FASEA',
    prelimDescription: (m, p) => `${m} partida • ${p} bikote sailkatzen dira`,
    round: (n) => `${n}. txanda`,
    semiFinals: 'Finalerdiak',
    final: 'Finala',
    champion: 'TXAPELDUNA',
    bye: 'BYE',
    confirmResult: 'Emaitza baieztatu',
    invalidScore: (w, b) => `Emaitza baliogabea. ${b}ko onenak: irabazleak ${w} garaipen behar ditu.`,
    editResult: '✏️ Editatu',
    editWarning: 'Emaitza hau editatzeak ondorengo emaitzak ezabatuko ditu. Jarraitu?',
    exportTournament: '↓ Txapelketa esportatu',
    exportPairsOnly: '↓ Bikoteak soilik',
    importFile: '↑ Inportatu',
    signedBadge: '🔒 Sinatuta',
    importError: 'Errorea inportatzerakoan',
    mergeOrReplace: 'Zer egin lehendik dauden bikoteen?',
    mergeOption: 'Gehitu daudenei',
    replaceOption: 'Guztiak ordezkatu',
    tournamentChampions: '🏆 Txapelketako Txapeldunak',
    totalDistributed: 'Guztira banatuta',
    fileInvalid: 'Fitxategi baliogabea — ez da ezagutzen den formatua',
    signatureInvalid: '⚠️ Sinadura baliogabea — fitxategia aldatu da eta ezin da inportatu',
    versionIncompat: 'Fitxategi bertsioa ez da bateragarria',
  },

  en: {
    appTitle: 'Mus Tournament',
    player1Placeholder: 'Player 1',
    player2Placeholder: 'Player 2',
    addPair: 'Add pair',
    pairsRegistered: (n) => `${n} pair${n !== 1 ? 's' : ''} registered`,
    prelimNeeded: (m, p) => `→ Preliminary round: ${m} matches (${p} pairs)`,
    directToMain: (n) => `→ ${n} pairs go directly to the main bracket`,
    minPairsWarning: 'At least 2 pairs are required',
    oddPairsWarning: 'Odd number of pairs — please review the list',
    matchFormat: 'Match format',
    bestOfLabel: 'Best of',
    customBestOf: 'Custom…',
    invalidBestOf: 'Must be an odd number (1, 3, 5, 7…)',
    feesAndPrizes: '💰 Entry fees & prizes',
    entryFee: 'Entry fee per pair',
    prizeDistribution: 'Prize distribution',
    autoMode: 'Automatic',
    manualMode: 'Manual',
    autoSplit: 'Auto split',
    firstPrize: '🥇 1st prize',
    secondPrize: '🥈 2nd prize',
    thirdPrize: '🥉 3rd prize',
    fourthPrize: '🏅 4th prize',
    totalPool: 'Prize pool',
    distributed: 'Distributed',
    remainder: 'Remainder',
    entropyTitle: '🎲 Randomness level',
    entropyHint: 'Move the mouse around the screen for a safer draw',
    entropySecure: '🛡 Secure draw',
    entropyLabels: ['No randomness', 'Low', 'Medium', 'High', 'Very high', 'Maximum randomness!'],
    createTournament: 'Create tournament',
    resetTournament: 'Reset tournament',
    prelimPhase: 'PRELIMINARY ROUND',
    prelimDescription: (m, p) => `${m} matches • ${p} pairs qualify`,
    round: (n) => `Round ${n}`,
    semiFinals: 'Semi-finals',
    final: 'Final',
    champion: 'CHAMPION',
    bye: 'BYE',
    confirmResult: 'Confirm result',
    invalidScore: (w, b) => `Invalid result. Best of ${b}: winner needs ${w} wins.`,
    editResult: '✏️ Edit',
    editWarning: 'Editing this result will clear dependent results. Continue?',
    exportTournament: '↓ Export tournament',
    exportPairsOnly: '↓ Pairs only',
    importFile: '↑ Import',
    signedBadge: '🔒 Signed',
    importError: 'Import error',
    mergeOrReplace: 'What to do with existing pairs?',
    mergeOption: 'Add to existing',
    replaceOption: 'Replace all',
    tournamentChampions: '🏆 Tournament Champions',
    totalDistributed: 'Total distributed',
    fileInvalid: 'Invalid file — unrecognised format',
    signatureInvalid: '⚠️ Invalid signature — the file has been modified and cannot be imported',
    versionIncompat: 'Incompatible file version',
  },

  fr: {
    appTitle: 'Tournoi de Mus',
    player1Placeholder: 'Joueur 1',
    player2Placeholder: 'Joueur 2',
    addPair: 'Ajouter une paire',
    pairsRegistered: (n) => `${n} paire${n !== 1 ? 's' : ''} enregistrée${n !== 1 ? 's' : ''}`,
    prelimNeeded: (m, p) => `→ Tour préliminaire : ${m} matchs (${p} paires)`,
    directToMain: (n) => `→ ${n} paires passent directement au tableau`,
    minPairsWarning: 'Au moins 2 paires sont nécessaires',
    oddPairsWarning: 'Nombre de paires impair — vérifiez la liste',
    matchFormat: 'Format de match',
    bestOfLabel: 'Au meilleur de',
    customBestOf: 'Personnalisé…',
    invalidBestOf: 'Doit être un nombre impair (1, 3, 5, 7…)',
    feesAndPrizes: '💰 Inscriptions et prix',
    entryFee: 'Droit d\'inscription par paire',
    prizeDistribution: 'Répartition des prix',
    autoMode: 'Automatique',
    manualMode: 'Manuel',
    autoSplit: 'Répartition auto',
    firstPrize: '🥇 1er prix',
    secondPrize: '🥈 2e prix',
    thirdPrize: '🥉 3e prix',
    fourthPrize: '🏅 4e prix',
    totalPool: 'Cagnotte totale',
    distributed: 'Distribué',
    remainder: 'Reste',
    entropyTitle: '🎲 Niveau d\'aléatoire',
    entropyHint: 'Bougez la souris pour un tirage plus sécurisé',
    entropySecure: '🛡 Tirage sécurisé',
    entropyLabels: ['Sans aléatoire', 'Faible', 'Moyen', 'Élevé', 'Très élevé', 'Aléatoire maximal !'],
    createTournament: 'Créer le tournoi',
    resetTournament: 'Réinitialiser',
    prelimPhase: 'TOUR PRÉLIMINAIRE',
    prelimDescription: (m, p) => `${m} matchs • ${p} paires se qualifient`,
    round: (n) => `Tour ${n}`,
    semiFinals: 'Demi-finales',
    final: 'Finale',
    champion: 'CHAMPION',
    bye: 'BYE',
    confirmResult: 'Confirmer le résultat',
    invalidScore: (w, b) => `Résultat invalide. Au meilleur de ${b} : le gagnant doit avoir ${w} victoires.`,
    editResult: '✏️ Modifier',
    editWarning: 'Modifier ce résultat effacera les résultats dépendants. Continuer ?',
    exportTournament: '↓ Exporter le tournoi',
    exportPairsOnly: '↓ Paires seulement',
    importFile: '↑ Importer',
    signedBadge: '🔒 Signé',
    importError: 'Erreur d\'importation',
    mergeOrReplace: 'Que faire avec les paires existantes ?',
    mergeOption: 'Ajouter aux existantes',
    replaceOption: 'Remplacer toutes',
    tournamentChampions: '🏆 Champions du Tournoi',
    totalDistributed: 'Total distribué',
    fileInvalid: 'Fichier invalide — format non reconnu',
    signatureInvalid: '⚠️ Signature invalide — le fichier a été modifié et ne peut pas être importé',
    versionIncompat: 'Version de fichier incompatible',
  },
};
```

### Usage in components

```typescript
// In TournamentApp root
const [lang, setLang] = useState<LangCode>(() => {
  const saved = localStorage.getItem('mus-lang');
  return (saved as LangCode) ?? 'es';
});

const t = translations[lang];

// Persist on change
useEffect(() => { localStorage.setItem('mus-lang', lang); }, [lang]);

// Pass t down via props or React context (prefer context for deep trees)
const I18nContext = React.createContext<Translations>(translations.es);
```

### Language selector UI

Place a compact language picker in the **header**, top-right corner:

```
[🌐 ES ▼]   — dropdown: Español / Euskara / English / Français
```

Use flag emoji or ISO code labels. Switching language is instant (no reload needed).

### i18n in exports

Exported files always use **neutral field names** in English (JSON keys, CSV headers, Excel column names) regardless of the UI language — so files are interoperable across language settings. The UI language is stored as a `lang` field in the JSON/CSV/XLSX metadata but does not affect parsing.

```typescript
// In TournamentExport:
lang: LangCode;   // informational only — not used for import logic
```

### Extensibility

To add a new language, add one entry to `translations` with the new `LangCode` and add the code to the `LangCode` union type and the language picker dropdown. No other changes needed.

---



---

## Key UX Rules

1. **No page scroll** — everything fits in viewport. Bracket section scrolls horizontally if wide.
2. **Bracket is revealed immediately** after clicking "Crear torneo" — including preliminary phase.
3. **bestOf is locked** once the bracket is generated — shown as a permanent badge `🔒 Al mejor de 5` in the header.
4. **Result entry** — each match card shows two number inputs (one per pair). Submission validates the score against `isValidScore`. Error shown inline with the expected valid range.
5. **Score correction** — completed matches have an ✏️ button. Editing clears all downstream matches. A confirmation dialog warns the user (text from `t.editWarning`).
6. **BYE handling** — auto-advance silently, never show BYE in final bracket if possible. No score shown on BYE matches.
7. **Reset button** — appears after tournament is generated; resets to entry phase (keeps pairs and bestOf selection).
8. **Seed display** — show the entropy seed as a small hex number for provenance (e.g., `#3f2a91b`).
9. **Language** — all UI text goes through `t.*` translation keys, never hardcoded strings. Language switch is instant.

---

## Output Checklist

- [ ] `src/pages/index.astro` — minimal shell with Google Fonts import
- [ ] `src/components/TournamentApp.tsx` — full React island with all logic
- [ ] `tailwind.css` or global CSS with `@import "tailwindcss"` + `@theme` vars
- [ ] `astro.config.mjs` — with `@astrojs/react` and `@astrojs/tailwind` (or inline CSS import)
- [ ] All bracket logic in one file, no external bracket libraries
- [ ] Entropy listeners mounted on `useEffect(() => { ... }, [])`
- [ ] Preliminary round calculated and displayed separately from main bracket
- [ ] **Format**: `bestOf` selector (3/5/7/9/custom) shown before generating bracket
- [ ] **Format**: `bestOf` locked after bracket generated, shown as badge in header
- [ ] **Format**: `isValidScore` enforced on every result submission with inline error
- [ ] **Format**: Score correction (✏️) cascades downstream — clears dependent match results
- [ ] Match cards show score inputs when pending, and `score1–score2` display when complete
- [ ] Full-viewport layout, no body scroll
- [ ] **Fees & Prizes**: `entryFee` + `currency` input in left panel (collapsible section)
- [ ] **Fees & Prizes**: 4 prize inputs (🥇🥈🥉🏅) with manual and auto-distribution modes
- [ ] **Fees & Prizes**: Auto mode computes prizes from `entryFee × pairCount` with configurable split (50/30/15/5 default); live preview shown before bracket generation
- [ ] **Fees & Prizes**: `prizeConfig` locked after bracket generated (same as `bestOf`)
- [ ] **Fees & Prizes**: Semi-final losers tracked as 3rd/4th place
- [ ] **Fees & Prizes**: `thirdPlaceShared` option to split 3rd+4th prize equally
- [ ] **Fees & Prizes**: Podium view shown when tournament finishes — staggered animation 4th→1st
- [ ] **Fees & Prizes**: Prize column hidden in podium if all prizes are 0
- [ ] **Export (full)**: JSON/CSV/Excel all include `prizeConfig` + `podium` + `lang` in signed payload
- [ ] **Export (full)**: Excel adds sheets "Premios" + "Metadatos" with full breakdown; HMAC-SHA256 signed
- [ ] **Export (pairs-only)**: Separate button always visible when `pairs.length >= 1`
- [ ] **Export (pairs-only)**: Three formats (JSON `pairs-1`, CSV, Excel) — unsigned, lightweight
- [ ] **Import**: Auto-detects full vs pairs-only from `version` field / presence of `#SIG`
- [ ] **Import (full)**: Rejects tampered files with `t.signatureInvalid` error; restores complete state
- [ ] **Import (pairs-only)**: Offers merge-or-replace dialog (`t.mergeOrReplace`); never touches bracket/score/prize state
- [ ] **Crypto**: Key derived from seed via HMAC-SHA256 (Web Crypto API, no server)
- [ ] **Crypto**: Canonical payload with sorted keys signed — not the full file
- [ ] **i18n**: `translations` object with `es`, `eu`, `en`, `fr` entries covering ALL UI strings
- [ ] **i18n**: Language picker in header (🌐 dropdown) — instant switch, persisted in `localStorage`
- [ ] **i18n**: No hardcoded UI strings — all through `t.*` keys via React context
- [ ] **i18n**: Export field names always in English regardless of UI language; `lang` stored as metadata
- [ ] **Design**: Distinctive aesthetic direction chosen and executed (NOT generic dark dashboard)
- [ ] **Design**: Characterful display font paired with refined body font (NOT Inter/Roboto alone)
- [ ] **Design**: CSS variables for all colors in `@theme {}` block
- [ ] **Design**: Background has depth/texture (not flat solid color)
- [ ] **Design**: At least 3 meaningful animations (load reveal, winner flash, bracket propagation)
- [ ] **Design**: Bracket connecting lines styled to match the aesthetic (glow, gold, neon, etc.)
