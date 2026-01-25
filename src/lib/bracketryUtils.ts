export function buildBracketryData(matches: any[], participants: any[]) {
  // Group matches by round_id
  const roundsMap = new Map<number, any[]>();
  for (const m of matches) {
    const r = (typeof m.round_id !== 'undefined') ? Number(m.round_id) : 0;
    if (!roundsMap.has(r)) roundsMap.set(r, []);
    roundsMap.get(r)!.push(m);
  }

  const roundIndexes = Array.from(roundsMap.keys()).sort((a, b) => a - b);
  const rounds = roundIndexes.map((ri) => ({ name: `Round ${ri + 1}` }));

  const bracketMatches: any[] = [];
  for (const ri of roundIndexes) {
    const seeds = roundsMap.get(ri) || [];
    // sort matches within round by id so order is deterministic
    seeds.sort((a: any, b: any) => (a.id ?? 0) - (b.id ?? 0));
    for (let order = 0; order < seeds.length; order++) {
      const m = seeds[order];
      const getName = (opp: any) => {
        if (!opp) return '';
        if (typeof opp === 'string') return opp;
        if (opp.name) return opp.name;
        const p = participants.find((x: any) => String(x.id) === String(opp.id));
        return p ? p.name : '';
      };
      const sideA = getName(m.opponent1);
      const sideB = getName(m.opponent2);
      bracketMatches.push({ roundIndex: ri, order, sides: [{ title: sideA || '' }, { title: sideB || '' }], matchId: m.id });
    }
  }

  return { rounds, matches: bracketMatches };
}
