export type EntropyEvent =
  | { t: 'k'; key: string; ts: number; dt: number }
  | { t: 'm'; x: number; y: number; ts: number }
  | { t: 'c'; x: number; y: number; ts: number; last?: boolean };

export function computeEntropyScore(events: EntropyEvent[]): number {
  const mouseEvents = events.filter((e) => e.t === 'm') as Extract<EntropyEvent, { t: 'm' }>[];
  const keyEvents = events.filter((e) => e.t === 'k') as Extract<EntropyEvent, { t: 'k' }>[];
  const clickEvents = events.filter((e) => e.t === 'c') as Extract<EntropyEvent, { t: 'c' }>[];

  let mouseDist = 0;
  for (let i = 1; i < mouseEvents.length; i++) {
    const dx = mouseEvents[i].x - mouseEvents[i - 1].x;
    const dy = mouseEvents[i].y - mouseEvents[i - 1].y;
    mouseDist += Math.sqrt(dx * dx + dy * dy);
  }
  const mouseScore = Math.min(60, (mouseDist / 5000) * 60);

  const uniqueKeys = new Set(keyEvents.map((e) => e.key)).size;
  const keyScore = Math.min(30, (uniqueKeys / 15) * 30);

  const clickScore = Math.min(10, clickEvents.length * 2);

  return Math.round(mouseScore + keyScore + clickScore);
}

// Deterministic seed derivation from events array. Uses a simple string hash.
export function deriveSeed(events: EntropyEvent[]): number {
  const raw = JSON.stringify(events);
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Mulberry32 PRNG
export function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
