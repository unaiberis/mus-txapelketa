import { describe, it, expect } from 'vitest';
import { buildBracketryData } from './bracketryUtils';

describe('buildBracketryData', () => {
  it('converts matches and participants into bracketry shape', () => {
    const participants = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
    const matches = [
      { id: 100, round_id: 0, opponent1: { id: 1 }, opponent2: { id: 2 } },
    ];
    const res = buildBracketryData(matches, participants);
    expect(res.rounds).toHaveLength(1);
    expect(res.matches).toHaveLength(1);
    expect(res.matches[0].sides[0].title).toBe('A');
    expect(res.matches[0].sides[1].title).toBe('B');
    expect(res.matches[0].matchId).toBe(100);
  });
});
