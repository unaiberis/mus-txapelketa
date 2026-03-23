import React, { useMemo } from 'react';
import BracketCard, { BRACKET_CARD_H, BRACKET_CARD_W } from './BracketCard';
import { type Match } from '../lib/tournament';
import { t as tr, type Lang } from '../lib/i18n';

/* ── Layout constants ─────────────────────────────────────────────────────── */
const CARD_H = BRACKET_CARD_H;   // 88 px – must match BracketCard
const CARD_W = BRACKET_CARD_W;   // 216 px – must match BracketCard
const GAP_V  = 14;                // px – gap between cards in round-0
const GAP_H  = 56;                // px – horizontal gap between rounds
const HDR_H  = 28;                // px – height of round-label row at top

/** Slot unit: space each round-0 card occupies (card + gap) */
const S = CARD_H + GAP_V;

/**
 * Top Y of card at [roundIdx][matchIdx] (relative to the bracket canvas origin).
 * Each successive round doubles the slot size so cards are perfectly centred
 * between their two feeder matches.
 */
function cardTop(rIdx: number, mIdx: number): number {
  const slots = Math.pow(2, rIdx); // how many R0 slots this card spans
  return mIdx * slots * S + (slots * S - CARD_H) / 2 + HDR_H;
}

/** Vertical centre of a card. */
function cardCY(rIdx: number, mIdx: number): number {
  return cardTop(rIdx, mIdx) + CARD_H / 2;
}

/** Left X of a round column. */
function colX(rIdx: number): number {
  return rIdx * (CARD_W + GAP_H);
}

/* ── Round label helper ───────────────────────────────────────────────────── */
function roundLabel(rIdx: number, total: number, lang: Lang): string {
  if (total === 1) return 'Final';
  if (rIdx === total - 1) return 'Final';
  if (rIdx === total - 2) return total > 2 ? 'Semifinal' : tr(lang, 'round.header', { n: 1 });
  if (rIdx === total - 3) return 'Cuartos';
  return tr(lang, 'round.header', { n: rIdx + 1 });
}

/* ── Props ────────────────────────────────────────────────────────────────── */
export interface BracketViewProps {
  rounds: Match[][];
  bestOf: number;
  allPairs?: string[];
  onResult: (matchId: string, score1: number, score2: number) => void;
  onEdit: (matchId: string) => void;
  lang: Lang;
}

/* ── Component ────────────────────────────────────────────────────────────── */
export default function BracketView({
  rounds,
  bestOf,
  allPairs,
  onResult,
  onEdit,
  lang,
}: BracketViewProps) {
  const numRounds = rounds.length;
  /* Compute connectors via hook unconditionally to keep hooks order stable */
  const connectors = useMemo(() => {
    if (numRounds === 0) return [] as React.ReactNode[];

    const els: React.ReactNode[] = [];

    for (let r = 0; r < numRounds - 1; r++) {
      const nextMatches = rounds[r + 1] ?? [];

      for (let j = 0; j < nextMatches.length; j++) {
        const i0 = j * 2;       // top feeder
        const i1 = j * 2 + 1;  // bottom feeder

        const x0   = colX(r) + CARD_W;          // right edge of round-r cards
        const x1   = colX(r + 1);               // left edge of round-r+1 card
        const midX  = x0 + GAP_H / 2;           // vertical bar X

        const cy0   = cardCY(r, i0);
        const cy1   = cardCY(r, i1);
        const cyN   = cardCY(r + 1, j);

        // Only show connectors if both feeder cards actually exist in the data
        const hasTop = i0 < rounds[r].length;
        const hasBot = i1 < rounds[r].length;

        /* Horizontal stub out of top feeder */
        if (hasTop) {
          els.push(
            <line
              key={`ht-${r}-${j}`}
              x1={x0} y1={cy0}
              x2={midX} y2={cy0}
            />
          );
        }
        /* Horizontal stub out of bottom feeder */
        if (hasBot) {
          els.push(
            <line
              key={`hb-${r}-${j}`}
              x1={x0} y1={cy1}
              x2={midX} y2={cy1}
            />
          );
        }
        /* Vertical bar connecting the two stubs */
        if (hasTop && hasBot) {
          els.push(
            <line
              key={`v-${r}-${j}`}
              x1={midX} y1={cy0}
              x2={midX} y2={cy1}
            />
          );
        }
        /* Horizontal stub into the next-round card */
        els.push(
          <line
            key={`hn-${r}-${j}`}
            x1={midX} y1={cyN}
            x2={x1} y2={cyN}
          />
        );
      }
    }

    return els;
  }, [rounds, numRounds]);

  if (numRounds === 0) return null;

  const firstRoundMatches = rounds[0].length;

  /* Canvas dimensions */
  const canvasW = numRounds * (CARD_W + GAP_H) - GAP_H;
  const canvasH = firstRoundMatches * S - GAP_V + HDR_H + 16;

  /* ── SVG connector paths ──────────────────────────────────────────────── */

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── Scoped styles ────────────────────────────────────────────── */}
      <style>{`
        /* BracketCard shell */
        .bcard {
          width: ${CARD_W}px;
          height: ${CARD_H}px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          padding: 5px 7px;
          position: relative;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-left: 3px solid var(--color-accent);
          border-radius: 6px;
          transition: box-shadow 0.15s, border-left-color 0.15s;
          overflow: hidden;
        }
        .bcard:hover {
          box-shadow: 0 2px 14px var(--color-accent-glow);
        }
        .bcard--pending {
          border-left-color: var(--color-border);
          opacity: 0.5;
        }
        .bcard--bye {
          border-left-color: rgba(255,255,255,0.12);
          opacity: 0.7;
        }
        .bcard--done {
          border-left-color: var(--color-accent);
        }
        .bcard--active {
          border-left-color: rgba(230,242,239,0.5);
        }

        /* Edit button (appears on hover) */
        .bcard-edit {
          position: absolute;
          bottom: 3px;
          right: 4px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 0.65rem;
          opacity: 0;
          transition: opacity 0.15s;
          padding: 0;
          line-height: 1;
        }
        .bcard:hover .bcard-edit { opacity: 0.65; }
        .bcard-edit:hover { opacity: 1 !important; }

        /* Score input */
        .bcard-input {
          width: 2rem;
          text-align: center;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 3px;
          color: var(--color-text);
          font-family: var(--font-display);
          font-size: 0.9rem;
          padding: 1px 3px;
          flex-shrink: 0;
          outline: none;
        }
        .bcard-input:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 2px var(--color-accent-glow);
        }
        /* hide browser spin buttons */
        .bcard-input::-webkit-inner-spin-button,
        .bcard-input::-webkit-outer-spin-button { -webkit-appearance: none; }

        /* Confirm button */
        .bcard-submit {
          position: absolute;
          bottom: 4px;
          right: 5px;
          width: 18px;
          height: 18px;
          background: var(--color-accent);
          color: var(--color-bg);
          border: none;
          border-radius: 3px;
          font-size: 0.65rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          line-height: 1;
          transition: filter 0.15s;
        }
        .bcard-submit:hover { filter: brightness(1.2); }

        /* ── Bracket canvas wrappers ─────────────────────────────────── */
        .bracket-scroll {
          overflow-x: auto;
          overflow-y: visible;
          padding-bottom: 1.5rem;
        }
        .bracket-canvas {
          position: relative;
        }

        /* ── Round label ────────────────────────────────────────────── */
        .bracket-round-label {
          position: absolute;
          top: 4px;
          text-align: center;
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--color-text-muted);
          pointer-events: none;
        }
        .bracket-round-label--final {
          color: var(--color-accent);
          letter-spacing: 0.18em;
        }

        /* ── SVG connector lines ────────────────────────────────────── */
        .bracket-svg {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none;
          overflow: visible;
        }
      `}</style>

      <div className="bracket-scroll">
        <div
          className="bracket-canvas"
          style={{ width: canvasW, height: canvasH }}
        >
          {/* ── SVG connector lines ──────────────────────────────────── */}
          <svg
            className="bracket-svg"
            width={canvasW}
            height={canvasH}
            style={{ zIndex: 1 }}
          >
            <g
              stroke="var(--color-accent)"
              strokeWidth="1.5"
              opacity="0.3"
              fill="none"
              strokeLinecap="round"
            >
              {connectors}
            </g>
          </svg>

          {/* ── Round columns ────────────────────────────────────────── */}
          {rounds.map((round, rIdx) => {
            const left = colX(rIdx);
            const isFinal = rIdx === numRounds - 1;

            return (
              <React.Fragment key={`round-${rIdx}`}>
                {/* Round label */}
                <div
                  className={`bracket-round-label${isFinal ? ' bracket-round-label--final' : ''}`}
                  style={{ left, width: CARD_W }}
                >
                  {roundLabel(rIdx, numRounds, lang)}
                </div>

                {/* Match cards */}
                {round.map((match, mIdx) => (
                  <div
                    key={match.id}
                    style={{
                      position: 'absolute',
                      left,
                      top: cardTop(rIdx, mIdx),
                      zIndex: 2,
                    }}
                  >
                    <BracketCard
                      match={match}
                      bestOf={bestOf}
                      onResult={onResult}
                      onEdit={onEdit}
                      lang={lang}
                      allPairs={allPairs}
                    />
                  </div>
                ))}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
}