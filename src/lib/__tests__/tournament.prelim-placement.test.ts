import { describe, it, expect } from 'vitest';
import {
  generateBracket,
  findMatch,
  registerResult,
  preliminaryInfo,
  defaultPrizeConfig,
} from '../../lib/tournament';

describe('prelim placement and propagation', () => {
  const makePairs = (n: number) => Array.from({ length: n }, (_, i) => `P${i + 1}`);

  it.each([5, 6, 80])('places prelim placeholders into rounds[0] for %i pairs', (n) => {
    const pairs = makePairs(n);
    const state = generateBracket(pairs, 123, 5, defaultPrizeConfig);
    const info = preliminaryInfo(n);

    if (info.prelimMatches > 0) {
      expect(state.prelim.length).toBeGreaterThan(0);
    }

    // Count null slots in round 1 — these represent placeholders for prelim winners
    const nullSlots = state.rounds[0].reduce((acc, m) => {
      return acc + (m.pair1 === null ? 1 : 0) + (m.pair2 === null ? 1 : 0);
    }, 0);

    expect(nullSlots).toBe(info.prelimMatches);
    expect(state.rounds[0].some((m) => m.pair1 === null || m.pair2 === null)).toBe(
      info.prelimMatches > 0
    );
  });

  it('resolves a prelim and ensures the winner is placed into rounds[0] and can advance', () => {
    const n = 6;
    const pairs = makePairs(n);
    let state = generateBracket(pairs, 42, 5, defaultPrizeConfig);

    if (state.prelim.length === 0) {
      // Sanity: this test expects prelims for n=6
      throw new Error('Expected prelim matches for n=6');
    }

    const prelimMatch = state.prelim[0];
    const winner = prelimMatch.pair1 ?? prelimMatch.pair2!;

    // Resolve the prelim (winner advances into rounds[0])
    state = registerResult(state, prelimMatch.id, 3, 0);

    // The winner should now appear somewhere in rounds[0]
    let placed = state.rounds[0].find((m) => m.pair1 === winner || m.pair2 === winner);
    expect(placed).toBeDefined();

    // Ensure the R1 match containing the winner has both participants before attempting to advance.
    if (!(placed!.pair1 && placed!.pair2)) {
      // Try resolving another prelim to fill the opponent slot
      if (state.prelim.length > 1) {
        const other = state.prelim[1];
        state = registerResult(state, other.id, 3, 0);
        placed = state.rounds[0].find((m) => m.pair1 === winner || m.pair2 === winner);
      }
    }

    if (!(placed!.pair1 && placed!.pair2)) {
      throw new Error('Could not populate both sides of the R1 match for the prelim winner');
    }

    // Now register a R1 victory for the winner and ensure they propagate to rounds[1]
    const r1MatchId = placed!.id;
    const r1Winner = placed!.pair1 === winner ? placed!.pair1 : placed!.pair2;
    state = registerResult(state, r1MatchId, 3, 0);

    // The winner should now appear in rounds[1]
    const appearsInNext = state.rounds[1].some((m) => m.pair1 === r1Winner || m.pair2 === r1Winner);
    expect(appearsInNext).toBe(true);
  });
});
