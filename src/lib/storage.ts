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
