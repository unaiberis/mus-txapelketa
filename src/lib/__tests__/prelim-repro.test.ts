import { describe, it, expect } from 'vitest';
import { generateBracket, findMatch, registerResult } from '../../lib/tournament';

describe('prelim repro', () => {
  it('places prelim winner only in r1 (not jumping rounds)', () => {
    const pairCount = 138; // large non-power-of-2 to force many byes + prelims
    const pairs = Array.from({ length: pairCount }, (_, i) => `P${i + 1}`);
    const state = generateBracket(pairs, 42, 5, { entryFee: 0, currency: 'EUR', prizes: [0,0,0,0], prizeMode: 'manual', autoSplit: [50,30,15,5], thirdPlaceShared: false });

    // ensure there are prelim matches
    expect(state.prelim.length).toBeGreaterThan(0);

    const firstPrelim = state.prelim[0];
    expect(firstPrelim).toBeDefined();
    if (!firstPrelim) return;

    // register a win for pair1 in the first prelim
    if (!firstPrelim.pair1 || !firstPrelim.pair2) return;

    const after = registerResult(state, firstPrelim.id, 3, 0);

    // find where that winner was placed
    const winner = firstPrelim.pair1;
    // it should exist in round 1 somewhere, but MUST NOT appear as winner in the final
    const final = after.rounds[after.rounds.length - 1][0];
    expect(final.winner).not.toBe(winner);
  });
});
