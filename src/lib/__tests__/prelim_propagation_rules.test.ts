import { describe, it, expect } from 'vitest';
import { generateBracket, registerResult, defaultPrizeConfig } from '../../lib/tournament';

describe('Prelim propagation rules', () => {
  const makePairs = (n: number) => Array.from({ length: n }, (_, i) => `P${i + 1}`);

  it('resolving prelims only fills rounds[0] (no propagation to later rounds)', () => {
    const n = 6; // produces prelim matches
    let state = generateBracket(makePairs(n), 99, 5, defaultPrizeConfig);

    // Collect prelim winners and resolve each prelim
    const prelimWinners: string[] = [];
    for (const pm of state.prelim) {
      const _winner = pm.pair1 ?? pm.pair2!;
      prelimWinners.push(_winner);
      state = registerResult(state, pm.id, 3, 0);
    }

    // All prelim winners should now appear somewhere in rounds[0]
    for (const w of prelimWinners) {
      const inR0 = state.rounds[0].some((m) => m.pair1 === w || m.pair2 === w);
      expect(inR0).toBe(true);
    }

    // But none of these winners should have been propagated to rounds[1] yet
    for (const w of prelimWinners) {
      const inR1 = state.rounds[1] ? state.rounds[1].some((m) => m.pair1 === w || m.pair2 === w) : false;
      expect(inR1).toBe(false);
    }

    // And no match in rounds[1] should have a winner set (no propagation)
    const anyWinnerInR1 = state.rounds[1] ? state.rounds[1].some((m) => Boolean(m.winner)) : false;
    expect(anyWinnerInR1).toBe(false);
  });

  it('after resolving a round-1 match the winner propagates to the next round', () => {
    const n = 6;
    let state = generateBracket(makePairs(n), 123, 5, defaultPrizeConfig);

    // Resolve prelims first
    for (const pm of state.prelim) {
      state = registerResult(state, pm.id, 3, 0);
    }

    // Find a round-1 match that now has two participants
    const r1Match = state.rounds[0].find((m) => m.pair1 && m.pair2);
    expect(r1Match).toBeDefined();

    const _winner = r1Match!.pair1!;
    // Resolve the R1 match
    state = registerResult(state, r1Match!.id, 3, 0);

    // The winner should now appear in rounds[1]
    const propagated = state.rounds[1].some((m) => m.pair1 === _winner || m.pair2 === _winner);
    expect(propagated).toBe(true);
  });
});
