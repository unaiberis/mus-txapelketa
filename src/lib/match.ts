export type Player = { id: string; name: string };

export function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Simple greedy pairing. If odd number, last one is left without pair.
export function pairPlayers(players: Player[], historyPairs = new Set<string>()) {
  const shuffled = shuffle(players);
  const pairs: [Player, Player][] = [];
  const used = new Set<string>();

  for (let i = 0; i < shuffled.length; i++) {
    if (used.has(shuffled[i].id)) continue;
    let found = false;
    for (let j = i + 1; j < shuffled.length; j++) {
      if (used.has(shuffled[j].id)) continue;
      const key1 = `${shuffled[i].id}-${shuffled[j].id}`;
      const key2 = `${shuffled[j].id}-${shuffled[i].id}`;
      if (!historyPairs.has(key1) && !historyPairs.has(key2)) {
        pairs.push([shuffled[i], shuffled[j]]);
        used.add(shuffled[i].id);
        used.add(shuffled[j].id);
        found = true;
        break;
      }
    }
    if (!found) {
      // If no partner found avoiding history, just pair with next available
      for (let j = i + 1; j < shuffled.length; j++) {
        if (used.has(shuffled[j].id)) continue;
        pairs.push([shuffled[i], shuffled[j]]);
        used.add(shuffled[i].id);
        used.add(shuffled[j].id);
        break;
      }
    }
  }

  return pairs;
}
