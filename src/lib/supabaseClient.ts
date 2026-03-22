// Supabase disabled for local-only mode. This file provides stub functions so the app runs without @supabase/supabase-js.

export const supabase = null as unknown;

export async function saveRound(_roundName: string, _pairs: Array<{ a: string; b: string }>) {
  console.warn('saveRound called but Supabase is disabled in local mode.');
  return { roundId: null };
}

export async function loadRounds() {
  console.warn('loadRounds called but Supabase is disabled in local mode.');
  return [];
}
