-- Supabase minimal schema for mus-txapelketa

create table if not exists players (
  id serial primary key,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists rounds (
  id serial primary key,
  name text,
  created_at timestamptz default now()
);

create table if not exists pairs (
  id serial primary key,
  round_id integer references rounds(id),
  player_a integer references players(id),
  player_b integer references players(id),
  created_at timestamptz default now()
);
