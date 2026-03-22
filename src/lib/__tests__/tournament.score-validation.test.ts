import { describe, it, expect } from 'vitest';
import { validateScore } from '../../lib/tournament';

describe('validateScore', () => {
  it('rejects non-integer or negative inputs', () => {
    expect(validateScore(-1, 0, 5).code).toBe('INVALID_INPUT');
    expect(validateScore(1.5, 0, 5).code).toBe('INVALID_INPUT');
  });

  it('rejects invalid bestOf', () => {
    expect(validateScore(1, 0, 4).code).toBe('BESTOF_INVALID');
    expect(validateScore(1, 0, 0).code).toBe('BESTOF_INVALID');
  });

  it('rejects ties', () => {
    const r = validateScore(2, 2, 5);
    expect(r.code).toBe('TIE_INVALID');
  });

  it('rejects when winner did not reach required wins', () => {
    const r = validateScore(2, 1, 5);
    expect(r.code).toBe('WINNER_WRONG');
  });

  it('rejects when loser has too many wins', () => {
    const r = validateScore(3, 3, 5);
    expect(r.code).toBe('TIE_INVALID');
  });

  it('rejects when total exceeds bestOf', () => {
    const r = validateScore(4, 2, 5);
    expect(r.code).toBe('TOTAL_EXCEEDS');
  });

  it('accepts valid scores', () => {
    expect(validateScore(3, 0, 5).valid).toBe(true);
    expect(validateScore(3, 2, 5).valid).toBe(true);
    expect(validateScore(1, 0, 1).valid).toBe(true);
  });
});
