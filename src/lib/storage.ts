export type Player = { id: string; name: string };

const KEY = 'mus:players';

export function savePlayersToStorage(players: Player[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(players));
  } catch (e) {
    console.warn('Could not save players to localStorage', e);
  }
}

export function loadPlayersFromStorage(): Player[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Player[];
  } catch (e) {
    console.warn('Could not load players from localStorage', e);
    return null;
  }
}

// Pairs persistence (stored as array of { a: string; b: string })
const PAIRS_KEY = 'mus:pairs';

export function savePairsToStorage(pairs: Array<{ a: string; b: string }>) {
  try {
    localStorage.setItem(PAIRS_KEY, JSON.stringify(pairs));
  } catch (e) {
    console.warn('Could not save pairs to localStorage', e);
  }
}

export function loadPairsFromStorage(): Array<{ a: string; b: string }> | null {
  try {
    const raw = localStorage.getItem(PAIRS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Array<{ a: string; b: string }>;
  } catch (e) {
    console.warn('Could not load pairs from localStorage', e);
    return null;
  }
}
