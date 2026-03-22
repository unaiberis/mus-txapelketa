export type EntropyEvent =
	| { t: 'k'; key: string; ts: number; dt: number }
	| { t: 'm'; x: number; y: number; ts: number }
	| { t: 'c'; x: number; y: number; ts: number; last?: true };

export interface MatchScore {
	score1: number;
	score2: number;
}

export interface Match {
	id: string;
	pair1: string | null;
	pair2: string | null;
	score?: MatchScore;
	winner?: string;
	round: number;
	isPrelim: boolean;
	// Optional mapping for prelim matches: where the winner should be placed in R1
	targetMatchId?: string;
	targetSlot?: 'pair1' | 'pair2';
	// Whether this match was created as an initial BYE (one participant, no opponent)
	initialBye?: boolean;
}

export type Phase = 'entry' | 'generated' | 'inProgress' | 'finished';

export interface PrizeConfig {
	entryFee: number;
	currency: string;
	prizes: [number, number, number, number];
	prizeMode: 'manual' | 'auto';
	autoSplit: [number, number, number, number];
	thirdPlaceShared: boolean;
}

export interface Podium {
	first: string;
	second: string;
	third: string | null;
	fourth: string | null;
}

export interface TournamentState {
	phase: Phase;
	pairs: string[];
	shuffled: string[];
	bestOf: number;
	prelim: Match[];
	rounds: Match[][];
	seed: number;
	prizeConfig: PrizeConfig;
	podium?: Podium;
}

export interface TournamentExport {
	version: '1';
	exportedAt: string;
	seed: number;
	bestOf: number;
	pairs: string[];
	shuffled: string[];
	prelim: Match[];
	rounds: Match[][];
	phase: Phase;
	prizeConfig: PrizeConfig;
	podium?: Podium;
	signature: string;
}

export const defaultPrizeConfig: PrizeConfig = {
	entryFee: 0,
	currency: 'EUR',
	prizes: [0, 0, 0, 0],
	prizeMode: 'manual',
	autoSplit: [50, 30, 15, 5],
	thirdPlaceShared: false,
};

export function mulberry32(seed: number): () => number {
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

function isMouseEvent(e: EntropyEvent): e is Extract<EntropyEvent, { t: 'm' }> {
	return e.t === 'm';
}

function isKeyEvent(e: EntropyEvent): e is Extract<EntropyEvent, { t: 'k' }> {
	return e.t === 'k';
}

function isClickEvent(e: EntropyEvent): e is Extract<EntropyEvent, { t: 'c' }> {
	return e.t === 'c';
}

export function computeEntropyScore(events: EntropyEvent[]): number {
	const mouseEvents = events.filter(isMouseEvent);
	const keyEvents = events.filter(isKeyEvent);
	const clickEvents = events.filter(isClickEvent);

	let mouseDist = 0;
	for (let i = 1; i < mouseEvents.length; i++) {
		const prev = mouseEvents[i - 1];
		const curr = mouseEvents[i];
		const dx = curr.x - prev.x;
		const dy = curr.y - prev.y;
		mouseDist += Math.sqrt(dx * dx + dy * dy);
	}
	const mouseScore = Math.min(60, (mouseDist / 5000) * 60);

	const uniqueKeys = new Set(keyEvents.map((e) => e.key)).size;
	const keyScore = Math.min(30, (uniqueKeys / 15) * 30);

	const clickScore = Math.min(10, clickEvents.length * 2);

	return Math.round(mouseScore + keyScore + clickScore);
}

export function deriveSeed(events: EntropyEvent[]): number {
	const raw = JSON.stringify(events);
	let hash = 0;
	for (let i = 0; i < raw.length; i++) {
		hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
	}
	const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
	return Math.abs(hash ^ ((now * 1000) | 0));
}

export function generateRandomPairs(count: number, seed?: number): string[] {
	const s = typeof seed === 'number' ? seed : Date.now();
	const rand = mulberry32(s);
	const totalPlayers = count * 2;
	const players: string[] = Array.from({ length: totalPlayers }, (_, i) => `Jugador ${i + 1}`);
	const shuffled = shuffle(players, rand);
	const pairs: string[] = [];
	for (let i = 0; i < shuffled.length; i += 2) {
		const p1 = shuffled[i] ?? `Jugador ${i + 1}`;
		const p2 = shuffled[i + 1] ?? `Jugador ${i + 2}`;
		pairs.push(`${p1} / ${p2}`);
	}
	return pairs;
}

export function nextPow2(n: number): number {
	let p = 1;
	while (p < n) p <<= 1;
	return p;
}

export function preliminaryInfo(n: number): {
	target: number;
	byeCount: number;
	prelimPairs: number;
	prelimMatches: number;
} {
	const target = nextPow2(n);
	if (target === n) {
		return { target, byeCount: n, prelimPairs: 0, prelimMatches: 0 };
	}
	const byeCount = target - n;
	const prelimPairs = n - byeCount;
	return { target, byeCount, prelimPairs, prelimMatches: prelimPairs / 2 };
}

export function isValidBestOf(n: number): boolean {
	return Number.isInteger(n) && n >= 1 && n % 2 === 1;
}

export function isValidScore(score1: number, score2: number, bestOf: number): boolean {
	const winsNeeded = Math.ceil(bestOf / 2);
	const maxScore = Math.max(score1, score2);
	const minScore = Math.min(score1, score2);
	return (
		Number.isInteger(score1) &&
		score1 >= 0 &&
		Number.isInteger(score2) &&
		score2 >= 0 &&
		maxScore === winsNeeded &&
		minScore < winsNeeded &&
		score1 + score2 <= bestOf
	);
}

export function computeAutoPrizes(
	entryFee: number,
	pairCount: number,
	pcts: [number, number, number, number]
): [number, number, number, number] {
	const pool = entryFee * pairCount;
	return pcts.map((p) => Math.floor((pool * p) / 100)) as [number, number, number, number];
}

export function prizePool(entryFee: number, pairCount: number): number {
	return entryFee * pairCount;
}

export function generateBracket(
	pairs: string[],
	seed: number,
	bestOf: number,
	prizeConfig: PrizeConfig
): TournamentState {
	const rand = mulberry32(seed);
	const shuffled = shuffle(pairs, rand);
	const n = shuffled.length;
	const info = preliminaryInfo(n);

	const byePairs = shuffled.slice(0, info.byeCount);
	const prelimPairsList = shuffled.slice(info.byeCount);

	const prelim: Match[] = [];
	for (let i = 0; i < prelimPairsList.length; i += 2) {
		prelim.push({
			id: `prelim-${i / 2}`,
			pair1: prelimPairsList[i] ?? null,
			pair2: prelimPairsList[i + 1] ?? null,
			round: 0,
			isPrelim: true,
		});
	}

	const r1Size = info.prelimMatches > 0 ? info.target / 2 : n;
	const numRounds = Math.max(1, Math.floor(Math.log2(r1Size)));

	const r1Participants: (string | null)[] = [];
	for (const p of byePairs) {
		r1Participants.push(p);
	}
	for (let i = 0; i < info.prelimMatches; i++) {
		r1Participants.push(null);
	}

	const r1: Match[] = [];
	for (let i = 0; i < r1Participants.length; i += 2) {
		const p1 = r1Participants[i] ?? null;
		const p2 = r1Participants[i + 1] ?? null;
		const match: Match = {
			id: `r1-${i / 2}`,
			pair1: p1,
			pair2: p2,
			round: 1,
			isPrelim: false,
			initialBye: Boolean((p1 && !p2) || (!p1 && p2)),
		};
		r1.push(match);
	}

	// Map prelim matches to explicit empty slots in R1 (stable mapping)
	const emptySlots: { matchId: string; slot: 'pair1' | 'pair2' }[] = [];
	for (let i = 0; i < r1.length; i++) {
		if (r1[i].pair1 === null) emptySlots.push({ matchId: r1[i].id, slot: 'pair1' });
		if (r1[i].pair2 === null) emptySlots.push({ matchId: r1[i].id, slot: 'pair2' });
	}
	for (let i = 0; i < prelim.length; i++) {
		const slot = emptySlots[i];
		if (slot) {
			prelim[i].targetMatchId = slot.matchId;
			prelim[i].targetSlot = slot.slot;
		}
	}

	const rounds: Match[][] = [r1];
	let prevRoundSize = r1.length;
	for (let r = 2; r <= numRounds; r++) {
		const round: Match[] = [];
		const roundSize = prevRoundSize / 2;
		for (let i = 0; i < roundSize; i++) {
			round.push({
				id: `r${r}-${i}`,
				pair1: null,
				pair2: null,
				round: r,
				isPrelim: false,
			});
		}
		rounds.push(round);
		prevRoundSize = roundSize;
	}

	return {
		phase: 'generated',
		pairs,
		shuffled,
		bestOf,
		prelim,
		rounds,
		seed,
		prizeConfig,
	};
}

export function findMatch(state: TournamentState, matchId: string): Match | undefined {
	const inPrelim = state.prelim.find((m) => m.id === matchId);
	if (inPrelim) return inPrelim;
	for (const round of state.rounds) {
		const found = round.find((m) => m.id === matchId);
		if (found) return found;
	}
	return undefined;
}

function updateMatchInState(
	state: TournamentState,
	matchId: string,
	updates: Partial<Match>
): TournamentState {
	return {
		...state,
		prelim: state.prelim.map((m) => (m.id === matchId ? { ...m, ...updates } : m)),
		rounds: state.rounds.map((round) =>
			round.map((m) => (m.id === matchId ? { ...m, ...updates } : m))
		),
	};
}

function findNextMatchSlot(
	state: TournamentState,
	matchId: string
): { matchId: string; slot: 'pair1' | 'pair2' } | null {
	if (matchId.startsWith('prelim-')) {
		const prelimIdx = parseInt(matchId.split('-')[1], 10);
		const prelimMatch = state.prelim.find((p) => p.id === matchId);
		if (prelimMatch && prelimMatch.targetMatchId && prelimMatch.targetSlot) {
			try {
				console.debug('[tournament] using prelim mapping', {
					matchId,
					prelimIdx,
					targetMatchId: prelimMatch.targetMatchId,
					targetSlot: prelimMatch.targetSlot,
				});
			} catch (err) {
				// noop
			}
			return { matchId: prelimMatch.targetMatchId, slot: prelimMatch.targetSlot };
		}

		// Fallback: compute empty slots dynamically if mapping not present
		const r1 = state.rounds[0] ?? [];
		const emptySlots: { matchId: string; slot: 'pair1' | 'pair2' }[] = [];
		for (let i = 0; i < r1.length; i++) {
			if (r1[i].pair1 === null) emptySlots.push({ matchId: r1[i].id, slot: 'pair1' });
			if (r1[i].pair2 === null) emptySlots.push({ matchId: r1[i].id, slot: 'pair2' });
		}

		if (prelimIdx < 0 || prelimIdx >= emptySlots.length) return null;
		return emptySlots[prelimIdx];
	}

	const parts = matchId.match(/^r(\d+)-(\d+)$/);
	if (!parts) return null;
	const roundNum = parseInt(parts[1], 10);
	const matchIdx = parseInt(parts[2], 10);
	const nextRoundIdx = roundNum;
	if (nextRoundIdx >= state.rounds.length) return null;

	const nextMatchIdx = Math.floor(matchIdx / 2);
	const slot: 'pair1' | 'pair2' = matchIdx % 2 === 0 ? 'pair1' : 'pair2';
	const nextMatch = state.rounds[nextRoundIdx]?.[nextMatchIdx];
	if (!nextMatch) return null;

	return { matchId: nextMatch.id, slot };
}

export function registerResult(
	state: TournamentState,
	matchId: string,
	score1: number,
	score2: number
): TournamentState {
	if (!isValidScore(score1, score2, state.bestOf)) {
		throw new Error('Resultado invalido');
	}

	const match = findMatch(state, matchId);
	if (!match) throw new Error('Partida no encontrada');
	if (!match.pair1 || !match.pair2) throw new Error('Partida incompleta');

	const winner = score1 > score2 ? match.pair1 : match.pair2;
	const score: MatchScore = { score1, score2 };

	let newState = updateMatchInState(state, matchId, { score, winner });
	newState = { ...newState, phase: 'inProgress' };

	const nextSlot = findNextMatchSlot(newState, matchId);
	if (nextSlot) {
		try {
			console.debug('[tournament] advancing winner', { matchId, winner, nextSlot });
		} catch (err) {}
		const slotUpdate: Partial<Match> = { [nextSlot.slot]: winner };
		newState = updateMatchInState(newState, nextSlot.matchId, slotUpdate);
	} else {
		try {
			console.debug('[tournament] no next slot found for', { matchId, winner });
		} catch (err) {}
	}

	const podium = detectPodium(newState);
	if (podium) {
		newState = { ...newState, podium, phase: 'finished' };
	}

	return newState;
}

export function clearDownstream(state: TournamentState, matchId: string): TournamentState {
	const match = findMatch(state, matchId);
	if (!match || !match.winner) return state;

	const oldWinner = match.winner;
	let newState = updateMatchInState(state, matchId, {
		score: undefined,
		winner: undefined,
	});

	const nextSlot = findNextMatchSlot(newState, matchId);
	if (nextSlot) {
		const nextMatch = findMatch(newState, nextSlot.matchId);
		if (nextMatch) {
			const currentInSlot = nextMatch[nextSlot.slot];
			if (currentInSlot === oldWinner) {
				const slotUpdate: Partial<Match> = { [nextSlot.slot]: null };
				newState = updateMatchInState(newState, nextSlot.matchId, slotUpdate);
				if (nextMatch.winner) {
					newState = clearDownstream(newState, nextSlot.matchId);
				}
			}
		}
	}

	newState = { ...newState, podium: undefined };

	if (newState.phase === 'finished') {
		newState = { ...newState, phase: 'inProgress' };
	}

	return newState;
}

export function detectPodium(state: TournamentState): Podium | null {
	const { rounds } = state;
	if (rounds.length === 0) return null;

	const finalRound = rounds[rounds.length - 1];
	if (finalRound.length !== 1) return null;
	const finalMatch = finalRound[0];
	if (!finalMatch.winner || !finalMatch.pair1 || !finalMatch.pair2) return null;

	const first = finalMatch.winner;
	const second = finalMatch.winner === finalMatch.pair1 ? finalMatch.pair2 : finalMatch.pair1;

	let third: string | null = null;
	let fourth: string | null = null;

	if (rounds.length >= 2) {
		const semis = rounds[rounds.length - 2];
		const semiLosers: string[] = [];
		for (const m of semis) {
			if (m.winner && m.pair1 && m.pair2) {
				const loser = m.winner === m.pair1 ? m.pair2 : m.pair1;
				semiLosers.push(loser);
			}
		}
		if (semiLosers.length >= 1) third = semiLosers[0];
		if (semiLosers.length >= 2) fourth = semiLosers[1];
	}

	return { first, second, third, fourth };
}

export async function deriveSigningKey(seed: number): Promise<CryptoKey> {
	const seedBytes = new TextEncoder().encode(`mus-bracket-${seed}`);
	const rawKey = await crypto.subtle.digest('SHA-256', seedBytes);
	return crypto.subtle.importKey(
		'raw',
		rawKey,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign', 'verify']
	);
}

export function canonicalize(data: Record<string, unknown>): string {
	return JSON.stringify(data, function (_key, value: unknown) {
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			const sorted: Record<string, unknown> = {};
			for (const k of Object.keys(value).sort()) {
				sorted[k] = (value as Record<string, unknown>)[k];
			}
			return sorted;
		}
		return value;
	});
}

export async function signExport(state: TournamentState): Promise<TournamentExport> {
	const payload = {
		version: '1' as const,
		exportedAt: new Date().toISOString(),
		seed: state.seed,
		bestOf: state.bestOf,
		pairs: state.pairs,
		shuffled: state.shuffled,
		prelim: state.prelim,
		rounds: state.rounds,
		phase: state.phase,
		prizeConfig: state.prizeConfig,
		podium: state.podium,
	};

	const key = await deriveSigningKey(state.seed);
	const canonical = canonicalize(payload as unknown as Record<string, unknown>);
	const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(canonical));
	const signature = Array.from(new Uint8Array(sigBuffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	return { ...payload, signature };
}

export async function verifyAndImport(raw: string): Promise<TournamentState> {
	let parsed: TournamentExport;
	try {
		parsed = JSON.parse(raw) as TournamentExport;
	} catch {
		throw new Error('Archivo invalido - no es JSON valido');
	}

	if (parsed.version !== '1') throw new Error('Version de archivo no compatible');

	const { signature, ...payload } = parsed;
	const key = await deriveSigningKey(payload.seed);
	const canonical = canonicalize(payload as unknown as Record<string, unknown>);

	const sigBytes = new Uint8Array(
		(signature.match(/.{2}/g) || []).map((h) => parseInt(h, 16))
	);
	const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(canonical));

	if (!valid) {
		throw new Error(
			'Firma invalida - el archivo ha sido modificado y no puede importarse'
		);
	}

	return {
		phase: payload.phase,
		pairs: payload.pairs,
		shuffled: payload.shuffled,
		bestOf: payload.bestOf,
		prelim: payload.prelim,
		rounds: payload.rounds,
		seed: payload.seed,
		prizeConfig: payload.prizeConfig,
		podium: payload.podium,
	};
}

export function exportCSVString(signed: TournamentExport): string {
	const rows: string[][] = [];
	rows.push(['fase', 'ronda', 'partida', 'pareja1', 'pareja2', 'score1', 'score2', 'ganador']);

	signed.prelim.forEach((m, i) =>
		rows.push([
			'previa',
			'0',
			String(i + 1),
			m.pair1 ?? 'BYE',
			m.pair2 ?? 'BYE',
			String(m.score?.score1 ?? ''),
			String(m.score?.score2 ?? ''),
			m.winner ?? '',
		])
	);

	signed.rounds.forEach((round, r) =>
		round.forEach((m, i) =>
			rows.push([
				'principal',
				String(r + 1),
				String(i + 1),
				m.pair1 ?? 'BYE',
				m.pair2 ?? 'BYE',
				String(m.score?.score1 ?? ''),
				String(m.score?.score2 ?? ''),
				m.winner ?? '',
			])
		)
	);

	rows.push(['#META', 'version', signed.version, '', '', '', '', '']);
	rows.push(['#META', 'seed', String(signed.seed), '', '', '', '', '']);
	rows.push(['#META', 'bestOf', String(signed.bestOf), '', '', '', '', '']);
	rows.push(['#META', 'exportedAt', signed.exportedAt, '', '', '', '', '']);
	rows.push(['#META', 'pairs', JSON.stringify(signed.pairs), '', '', '', '', '']);
	rows.push(['#META', 'shuffled', JSON.stringify(signed.shuffled), '', '', '', '', '']);
	rows.push(['#META', 'phase', signed.phase, '', '', '', '', '']);
	rows.push(['#META', 'prizeConfig', JSON.stringify(signed.prizeConfig), '', '', '', '', '']);
	if (signed.podium) {
		rows.push(['#META', 'podium', JSON.stringify(signed.podium), '', '', '', '', '']);
	}
	rows.push(['#SIG', signed.signature, '', '', '', '', '', '']);

	return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}

export function parseCSVImport(text: string): TournamentExport {
	const lines = text.split('\n').filter((l) => l.trim());
	const meta: Record<string, string> = {};
	let sig = '';

	for (const line of lines) {
		const cols = parseCSVLine(line);
		if (cols[0] === '#META') {
			meta[cols[1]] = cols[2];
		} else if (cols[0] === '#SIG') {
			sig = cols[1];
		}
	}

	const prelim: Match[] = [];
	const roundsMap: Map<number, Match[]> = new Map();

	for (const line of lines) {
		const cols = parseCSVLine(line);
		if (cols[0] === '#META' || cols[0] === '#SIG' || cols[0] === 'fase') continue;

		const fase = cols[0];
		const ronda = parseInt(cols[1], 10);
		const partida = parseInt(cols[2], 10) - 1;
		const pair1 = cols[3] === 'BYE' ? null : cols[3];
		const pair2 = cols[4] === 'BYE' ? null : cols[4];
		const s1 = cols[5] ? parseInt(cols[5], 10) : undefined;
		const s2 = cols[6] ? parseInt(cols[6], 10) : undefined;
		const winner = cols[7] || undefined;

		const match: Match = {
			id: fase === 'previa' ? `prelim-${partida}` : `r${ronda}-${partida}`,
			pair1,
			pair2,
			score: s1 !== undefined && s2 !== undefined ? { score1: s1, score2: s2 } : undefined,
			winner,
			round: ronda,
			isPrelim: fase === 'previa',
		};

		if (fase === 'previa') {
			prelim.push(match);
		} else {
			if (!roundsMap.has(ronda)) roundsMap.set(ronda, []);
			roundsMap.get(ronda)?.push(match);
		}
	}

	const rounds: Match[][] = [];
	const sortedKeys = [...roundsMap.keys()].sort((a, b) => a - b);
	for (const k of sortedKeys) {
		const round = roundsMap.get(k);
		if (round) rounds.push(round);
	}

	return {
		version: (meta.version || '1') as '1',
		exportedAt: meta.exportedAt || '',
		seed: parseInt(meta.seed || '0', 10),
		bestOf: parseInt(meta.bestOf || '5', 10),
		pairs: JSON.parse(meta.pairs || '[]') as string[],
		shuffled: JSON.parse(meta.shuffled || '[]') as string[],
		phase: (meta.phase || 'generated') as Phase,
		prizeConfig: meta.prizeConfig
			? (JSON.parse(meta.prizeConfig) as PrizeConfig)
			: defaultPrizeConfig,
		podium: meta.podium ? (JSON.parse(meta.podium) as Podium) : undefined,
		prelim,
		rounds,
		signature: sig,
	};
}

function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (inQuotes) {
			if (ch === '"') {
				if (i + 1 < line.length && line[i + 1] === '"') {
					current += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				current += ch;
			}
		} else {
			if (ch === '"') {
				inQuotes = true;
			} else if (ch === ',') {
				result.push(current);
				current = '';
			} else {
				current += ch;
			}
		}
	}
	result.push(current);
	return result;
}

export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
