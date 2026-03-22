import { describe, it, expect } from 'vitest';
import { computeEntropyScore, deriveSeed, mulberry32, shuffle, type EntropyEvent } from '../entropy';

describe('entropy utilities', () => {
  it('computeEntropyScore returns 0 for empty events', () => {
    expect(computeEntropyScore([])).toBe(0);
  });

  it('computeEntropyScore produces value between 0 and 100', () => {
    const events: EntropyEvent[] = [];
    for (let i = 0; i < 50; i++) events.push({ t: 'm', x: i * 10, y: i * 5, ts: Date.now() + i });
    for (let k = 0; k < 10; k++) events.push({ t: 'k', key: String(k), ts: Date.now() + 1000 + k, dt: k });
    for (let c = 0; c < 3; c++) events.push({ t: 'c', x: c * 5, y: c * 2, ts: Date.now() + 2000 + c });
    const score = computeEntropyScore(events);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('deriveSeed returns a non-negative number', () => {
    const events: EntropyEvent[] = [{ t: 'c', x: 0, y: 0, ts: 1 }];
    const s = deriveSeed(events);
    expect(typeof s).toBe('number');
    expect(s).toBeGreaterThanOrEqual(0);
  });

  it('mulberry32 is deterministic for same seed', () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    expect(a()).toBeCloseTo(b());
    expect(a()).toBeCloseTo(b());
  });

  it('shuffle with same PRNG seed produces same ordering', () => {
    const seed = 42;
    const rand1 = mulberry32(seed);
    const rand2 = mulberry32(seed);
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const s1 = shuffle(arr, rand1);
    const s2 = shuffle(arr, rand2);
    expect(s1).toEqual(s2);
  });
});
