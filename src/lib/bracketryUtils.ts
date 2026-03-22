type RawMatch = { id?: number | string; round_id?: number | string; opponent1?: unknown; opponent2?: unknown; name?: string };
type Participant = { id?: number | string; name?: string };

export function buildBracketryData(matches: RawMatch[], participants: Participant[]) {
  // Group matches by round_id
  const roundsMap = new Map<number, RawMatch[]>();
  for (const m of matches) {
    const r = (typeof m.round_id !== 'undefined') ? Number(m.round_id) : 0;
    if (!roundsMap.has(r)) roundsMap.set(r, []);
    roundsMap.get(r)!.push(m);
  }

  const roundIndexes = Array.from(roundsMap.keys()).sort((a, b) => a - b);
  const rounds = roundIndexes.map((ri) => ({ name: `Round ${ri + 1}` }));

  const bracketMatches: { roundIndex: number; order: number; sides: { title: string }[]; matchId?: number | string }[] = [];
  for (const ri of roundIndexes) {
    const seeds = roundsMap.get(ri) || [];
    // sort matches within round by id so order is deterministic
    seeds.sort((a, b) => (Number(a.id ?? 0) - Number(b.id ?? 0)));
    for (let order = 0; order < seeds.length; order++) {
      const m = seeds[order];
      const getName = (opp: unknown): string => {
        if (!opp) return '';
        if (typeof opp === 'string') return opp;
        if (typeof opp === 'object' && opp !== null) {
          const obj = opp as Record<string, unknown>;
          if ('name' in obj && typeof obj.name === 'string') return obj.name;
          if ('id' in obj) {
            const pid = String(obj.id);
            const p = participants.find((x) => String(x.id) === pid);
            return p?.name ?? '';
          }
        }
        return '';
      };
      const sideA = getName(m.opponent1);
      const sideB = getName(m.opponent2);
      bracketMatches.push({ roundIndex: ri, order, sides: [{ title: sideA || '' }, { title: sideB || '' }], matchId: m.id });
    }
  }

  return { rounds, matches: bracketMatches };
}
