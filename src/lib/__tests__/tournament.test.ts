import { describe, it, expect } from 'vitest';
import {
  mulberry32,
  shuffle,
  computeEntropyScore,
  deriveSeed,
  nextPow2,
  preliminaryInfo,
  isValidBestOf,
  isValidScore,
  computeAutoPrizes,
  prizePool,
  generateBracket,
  findMatch,
  registerResult,
  clearDownstream,
  detectPodium,
  deriveSigningKey,
  canonicalize,
  signExport,
  verifyAndImport,
  exportCSVString,
  parseCSVImport,
  defaultPrizeConfig,
  type EntropyEvent,
} from '../../lib/tournament';

describe('mulberry32', () => {
  it('produces deterministic sequence for same seed', () => {
    const r1 = mulberry32(42);
    const r2 = mulberry32(42);
    expect(r1()).toBe(r2());
    expect(r1()).toBe(r2());
    expect(r1()).toBe(r2());
  });

  it('produces different sequences for different seeds', () => {
    const r1 = mulberry32(1);
    const r2 = mulberry32(2);
    expect(r1()).not.toBe(r2());
  });

  it('returns values in [0, 1)', () => {
    const rand = mulberry32(123);
    for (let i = 0; i < 100; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('shuffle', () => {
  it('returns same order for same seed', () => {
    const arr = [1, 2, 3, 4, 5];
    const s1 = shuffle(arr, mulberry32(99));
    const s2 = shuffle(arr, mulberry32(99));
    expect(s1).toEqual(s2);
  });

  it('does not mutate original array', () => {
    const arr = [1, 2, 3];
    const original = [...arr];
    shuffle(arr, mulberry32(1));
    expect(arr).toEqual(original);
  });

  it('returns different order for different seeds', () => {
    const arr = Array.from({ length: 20 }, (_, i) => i);
    const s1 = shuffle(arr, mulberry32(1));
    const s2 = shuffle(arr, mulberry32(2));
    expect(s1).not.toEqual(s2);
  });
});

describe('computeEntropyScore', () => {
  it('returns 0 for empty events', () => {
    expect(computeEntropyScore([])).toBe(0);
  });

  it('increases with mouse movement distance', () => {
    const events: EntropyEvent[] = [
      { t: 'm', x: 0, y: 0, ts: 100 },
      { t: 'm', x: 100, y: 100, ts: 200 },
    ];
    expect(computeEntropyScore(events)).toBeGreaterThan(0);
  });

  it('increases with unique key presses', () => {
    const events: EntropyEvent[] = Array.from('abcdefghij').map((key, i) => ({
      t: 'k' as const,
      key,
      ts: i * 100,
      dt: 100,
    }));
    expect(computeEntropyScore(events)).toBeGreaterThan(0);
  });

  it('saturates at 100', () => {
    const events: EntropyEvent[] = [];
    for (let i = 0; i < 200; i++) {
      events.push({ t: 'm', x: i * 50, y: i * 50, ts: i * 50 });
    }
    for (const key of 'abcdefghijklmnop') {
      events.push({ t: 'k', key, ts: 1000, dt: 10 });
    }
    for (let i = 0; i < 10; i++) {
      events.push({ t: 'c', x: i, y: i, ts: 1000 });
    }
    expect(computeEntropyScore(events)).toBe(100);
  });
});

describe('deriveSeed', () => {
  it('returns a number', () => {
    const events: EntropyEvent[] = [{ t: 'k', key: 'a', ts: 100, dt: 0 }];
    expect(typeof deriveSeed(events)).toBe('number');
  });

  it('returns a non-negative number', () => {
    const events: EntropyEvent[] = [{ t: 'c', x: 10, y: 20, ts: 500 }];
    expect(deriveSeed(events)).toBeGreaterThanOrEqual(0);
  });
});

describe('nextPow2', () => {
  it.each([
    [1, 1],
    [2, 2],
    [3, 4],
    [4, 4],
    [5, 8],
    [7, 8],
    [8, 8],
    [9, 16],
    [16, 16],
    [17, 32],
    [64, 64],
    [80, 128],
  ])('nextPow2(%i) = %i', (input, expected) => {
    expect(nextPow2(input)).toBe(expected);
  });
});

describe('preliminaryInfo', () => {
  it('returns 0 prelim for power of 2', () => {
    const info = preliminaryInfo(8);
    expect(info.prelimPairs).toBe(0);
    expect(info.prelimMatches).toBe(0);
    expect(info.byeCount).toBe(8);
  });

  it('calculates correctly for 80 pairs', () => {
    const info = preliminaryInfo(80);
    expect(info.target).toBe(128);
    expect(info.byeCount).toBe(48);
    expect(info.prelimPairs).toBe(32);
    expect(info.prelimMatches).toBe(16);
  });

  it('calculates correctly for 3 pairs', () => {
    const info = preliminaryInfo(3);
    expect(info.target).toBe(4);
    expect(info.byeCount).toBe(1);
    expect(info.prelimPairs).toBe(2);
    expect(info.prelimMatches).toBe(1);
  });

  it('calculates correctly for 2 pairs', () => {
    const info = preliminaryInfo(2);
    expect(info.prelimPairs).toBe(0);
    expect(info.prelimMatches).toBe(0);
  });
});

describe('isValidBestOf', () => {
  it.each([1, 3, 5, 7, 9, 11])('accepts odd %i', (n) => {
    expect(isValidBestOf(n)).toBe(true);
  });

  it.each([0, 2, 4, 6, -1, 1.5])('rejects %s', (n) => {
    expect(isValidBestOf(n)).toBe(false);
  });
});

describe('isValidScore', () => {
  describe('bestOf=5 (winsNeeded=3)', () => {
    it.each([
      [3, 0],
      [3, 1],
      [3, 2],
      [0, 3],
      [1, 3],
      [2, 3],
    ])('accepts %i-%i', (s1, s2) => {
      expect(isValidScore(s1, s2, 5)).toBe(true);
    });

    it.each([
      [3, 3],
      [4, 1],
      [2, 1],
      [0, 0],
      [5, 2],
    ])('rejects %i-%i', (s1, s2) => {
      expect(isValidScore(s1, s2, 5)).toBe(false);
    });
  });

  describe('bestOf=7 (winsNeeded=4)', () => {
    it.each([
      [4, 0],
      [4, 1],
      [4, 2],
      [4, 3],
      [0, 4],
      [1, 4],
      [2, 4],
      [3, 4],
    ])('accepts %i-%i', (s1, s2) => {
      expect(isValidScore(s1, s2, 7)).toBe(true);
    });

    it.each([
      [3, 2],
      [5, 2],
      [4, 4],
    ])('rejects %i-%i', (s1, s2) => {
      expect(isValidScore(s1, s2, 7)).toBe(false);
    });
  });

  describe('bestOf=1 (winsNeeded=1)', () => {
    it('accepts 1-0 and 0-1', () => {
      expect(isValidScore(1, 0, 1)).toBe(true);
      expect(isValidScore(0, 1, 1)).toBe(true);
    });

    it('rejects 1-1', () => {
      expect(isValidScore(1, 1, 1)).toBe(false);
    });
  });
});

describe('computeAutoPrizes', () => {
  it('computes 50/30/15/5 split for 60 pairs at 15€', () => {
    const result = computeAutoPrizes(15, 60, [50, 30, 15, 5]);
    expect(result).toEqual([450, 270, 135, 45]);
  });

  it('returns all zeros for free entry', () => {
    expect(computeAutoPrizes(0, 10, [50, 30, 15, 5])).toEqual([0, 0, 0, 0]);
  });

  it('floors fractional euros', () => {
    const result = computeAutoPrizes(10, 3, [50, 30, 15, 5]);
    expect(result).toEqual([15, 9, 4, 1]);
  });
});

describe('prizePool', () => {
  it('returns fee * count', () => {
    expect(prizePool(15, 60)).toBe(900);
  });
});

describe('generateBracket', () => {
  const makePairs = (n: number) => Array.from({ length: n }, (_, i) => `Pair ${i + 1}`);

  it('creates correct structure for 4 pairs (power of 2)', () => {
    const state = generateBracket(makePairs(4), 42, 5, defaultPrizeConfig);
    expect(state.phase).toBe('generated');
    expect(state.prelim).toHaveLength(0);
    expect(state.rounds).toHaveLength(2);
    expect(state.rounds[0]).toHaveLength(2);
    expect(state.rounds[1]).toHaveLength(1);
    expect(state.bestOf).toBe(5);
    expect(state.seed).toBe(42);
  });

  it('creates preliminary matches for 3 pairs', () => {
    const state = generateBracket(makePairs(3), 42, 5, defaultPrizeConfig);
    expect(state.prelim.length).toBeGreaterThan(0);
  });

  it('creates preliminary matches for 5 pairs', () => {
    const state = generateBracket(makePairs(5), 42, 5, defaultPrizeConfig);
    expect(state.prelim.length).toBeGreaterThan(0);
  });

  it('shuffles pairs deterministically', () => {
    const pairs = makePairs(8);
    const s1 = generateBracket(pairs, 100, 5, defaultPrizeConfig);
    const s2 = generateBracket(pairs, 100, 5, defaultPrizeConfig);
    expect(s1.shuffled).toEqual(s2.shuffled);
  });

  it('all match IDs are unique', () => {
    const state = generateBracket(makePairs(16), 42, 5, defaultPrizeConfig);
    const allIds = [...state.prelim.map((m) => m.id), ...state.rounds.flatMap((r) => r.map((m) => m.id))];
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it('stores prizeConfig in state', () => {
    const cfg = { ...defaultPrizeConfig, entryFee: 20 };
    const state = generateBracket(makePairs(4), 42, 5, cfg);
    expect(state.prizeConfig.entryFee).toBe(20);
  });
});

describe('findMatch', () => {
  it('finds a match in prelim', () => {
    const state = generateBracket(
      Array.from({ length: 5 }, (_, i) => `P${i}`),
      1,
      5,
      defaultPrizeConfig
    );
    if (state.prelim.length > 0) {
      const found = findMatch(state, state.prelim[0].id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(state.prelim[0].id);
    }
  });

  it('finds a match in rounds', () => {
    const state = generateBracket(
      Array.from({ length: 4 }, (_, i) => `P${i}`),
      1,
      5,
      defaultPrizeConfig
    );
    const found = findMatch(state, state.rounds[0][0].id);
    expect(found).toBeDefined();
  });

  it('returns undefined for missing match', () => {
    const state = generateBracket(
      Array.from({ length: 4 }, (_, i) => `P${i}`),
      1,
      5,
      defaultPrizeConfig
    );
    expect(findMatch(state, 'nonexistent')).toBeUndefined();
  });
});

describe('registerResult', () => {
  it('sets winner and score on valid result', () => {
    const state = generateBracket(['A', 'B', 'C', 'D'], 42, 5, defaultPrizeConfig);
    const matchId = state.rounds[0][0].id;
    const match = findMatch(state, matchId);

    if (match?.pair1 && match.pair2) {
      const result = registerResult(state, matchId, 3, 1);
      const updated = findMatch(result, matchId);
      expect(updated?.winner).toBe(match.pair1);
      expect(updated?.score).toEqual({ score1: 3, score2: 1 });
      expect(result.phase).toBe('inProgress');
    }
  });

  it('throws on invalid score', () => {
    const state = generateBracket(['A', 'B', 'C', 'D'], 42, 5, defaultPrizeConfig);
    const matchId = state.rounds[0][0].id;
    expect(() => registerResult(state, matchId, 2, 1)).toThrow();
  });

  it('propagates winner to next round', () => {
    const state = generateBracket(['A', 'B', 'C', 'D'], 42, 5, defaultPrizeConfig);
    const r1m0 = state.rounds[0][0];

    if (r1m0.pair1 && r1m0.pair2) {
      const result = registerResult(state, r1m0.id, 3, 0);
      const final = result.rounds[1][0];
      const winner = r1m0.pair1;
      expect(final.pair1 === winner || final.pair2 === winner).toBe(true);
    }
  });
});

describe('clearDownstream', () => {
  it('clears result of the specified match', () => {
    let state = generateBracket(['A', 'B', 'C', 'D'], 42, 5, defaultPrizeConfig);
    const matchId = state.rounds[0][0].id;
    const match = findMatch(state, matchId);

    if (match?.pair1 && match.pair2) {
      state = registerResult(state, matchId, 3, 1);
      const cleared = clearDownstream(state, matchId);
      const updated = findMatch(cleared, matchId);
      expect(updated?.winner).toBeUndefined();
      expect(updated?.score).toBeUndefined();
    }
  });
});

describe('detectPodium', () => {
  it('returns null when final has no winner', () => {
    const state = generateBracket(['A', 'B', 'C', 'D'], 42, 5, defaultPrizeConfig);
    expect(detectPodium(state)).toBeNull();
  });

  it('detects podium when all matches complete for 2 pairs', () => {
    let state = generateBracket(['A', 'B'], 42, 5, defaultPrizeConfig);
    const finalMatch = state.rounds[state.rounds.length - 1][0];

    if (finalMatch.pair1 && finalMatch.pair2) {
      state = registerResult(state, finalMatch.id, 3, 0);
      expect(state.phase).toBe('finished');
      expect(state.podium).toBeDefined();
      expect(state.podium?.first).toBeDefined();
      expect(state.podium?.second).toBeDefined();
    }
  });
});

describe('canonicalize', () => {
  it('sorts keys alphabetically', () => {
    const result = canonicalize({ z: 1, a: 2, m: 3 });
    const parsed = JSON.parse(result) as Record<string, unknown>;
    expect(Object.keys(parsed)).toEqual(['a', 'm', 'z']);
  });

  it('sorts nested keys', () => {
    const result = canonicalize({ b: { z: 1, a: 2 }, a: 1 });
    expect(result).toBe('{"a":1,"b":{"a":2,"z":1}}');
  });

  it('is deterministic', () => {
    const data = { foo: 'bar', baz: [1, 2, 3], nested: { z: 1, a: 2 } };
    expect(canonicalize(data)).toBe(canonicalize(data));
  });
});

describe('deriveSigningKey', () => {
  it('derives a CryptoKey usable for HMAC', async () => {
    const key = await deriveSigningKey(42);
    expect(key.type).toBe('secret');
    expect(key.algorithm.name).toBe('HMAC');
  });
});

describe('signExport + verifyAndImport', () => {
  it('round-trips successfully', async () => {
    const state = generateBracket(['A', 'B', 'C', 'D'], 42, 5, defaultPrizeConfig);
    const signed = await signExport(state);
    expect(signed.signature).toBeTruthy();
    expect(signed.version).toBe('1');

    const raw = JSON.stringify(signed);
    const imported = await verifyAndImport(raw);
    expect(imported.seed).toBe(state.seed);
    expect(imported.pairs).toEqual(state.pairs);
    expect(imported.bestOf).toBe(state.bestOf);
  });

  it('rejects tampered payload', async () => {
    const state = generateBracket(['A', 'B', 'C', 'D'], 42, 5, defaultPrizeConfig);
    const signed = await signExport(state);
    signed.pairs = ['X', 'Y'];
    const raw = JSON.stringify(signed);
    await expect(verifyAndImport(raw)).rejects.toThrow(/Firma/i);
  });

  it('rejects tampered signature', async () => {
    const state = generateBracket(['A', 'B', 'C', 'D'], 42, 5, defaultPrizeConfig);
    const signed = await signExport(state);
    signed.signature = 'deadbeef'.repeat(8);
    const raw = JSON.stringify(signed);
    await expect(verifyAndImport(raw)).rejects.toThrow(/Firma/i);
  });

  it('rejects invalid JSON', async () => {
    await expect(verifyAndImport('not json')).rejects.toThrow(/JSON/);
  });

  it('rejects incompatible version', async () => {
    const state = generateBracket(['A', 'B', 'C', 'D'], 42, 5, defaultPrizeConfig);
    const signed = await signExport(state);
    const incompatible = { ...signed, version: '2' };
    await expect(verifyAndImport(JSON.stringify(incompatible))).rejects.toThrow(/Version/i);
  });
});

describe('exportCSVString + parseCSVImport', () => {
  it('round-trips match data', async () => {
    const state = generateBracket(['A', 'B', 'C', 'D'], 42, 5, defaultPrizeConfig);
    const signed = await signExport(state);
    const csv = exportCSVString(signed);
    const parsed = parseCSVImport(csv);
    expect(parsed.seed).toBe(signed.seed);
    expect(parsed.bestOf).toBe(signed.bestOf);
    expect(parsed.signature).toBe(signed.signature);
    expect(parsed.pairs).toEqual(signed.pairs);
  });

  it('handles special characters in pair names', async () => {
    const state = generateBracket(['A / "B"', 'C, D', 'E & F', 'G (H)'], 42, 5, defaultPrizeConfig);
    const signed = await signExport(state);
    const csv = exportCSVString(signed);
    const parsed = parseCSVImport(csv);
    expect(parsed.pairs).toEqual(signed.pairs);
  });
});
