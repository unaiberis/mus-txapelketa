import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Minimal helpers (examples)
export async function saveRound(roundName: string, pairs: Array<{ a: string; b: string }>) {
  const { data, error } = await supabase.from('rounds').insert([{ name: roundName }]).select('id').single();
  if (error) throw error;
  const roundId = (data as any).id;
  const toInsert = pairs.map((p) => ({ round_id: roundId, player_a: p.a, player_b: p.b }));
  const { error: err2 } = await supabase.from('pairs').insert(toInsert);
  if (err2) throw err2;
  return { roundId };
}
