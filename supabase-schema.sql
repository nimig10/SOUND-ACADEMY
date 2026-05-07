-- Run this once in the Supabase SQL Editor

create table if not exists students (
  id bigint primary key,
  name text not null,
  assigned_ids jsonb default '[]'
);

create table if not exists exercises (
  id bigint primary key,
  type text not null,
  title text not null,
  diff text default 'קל',
  description text default '',
  instructions text default '',
  audio_name text,
  notes text default ''
);

create table if not exists ex_types (
  id text primary key,
  label text not null,
  icon text,
  color text
);

create table if not exists scores (
  student_id bigint,
  exercise_id bigint,
  score integer,
  primary key (student_id, exercise_id)
);

create table if not exists mixer_channels (
  id integer primary key,
  name text not null
);

-- Allow public read/write (for now — add auth later)
alter table students       enable row level security;
alter table exercises      enable row level security;
alter table ex_types       enable row level security;
alter table scores         enable row level security;
alter table mixer_channels enable row level security;

create policy "public all" on students       for all using (true) with check (true);
create policy "public all" on exercises      for all using (true) with check (true);
create policy "public all" on ex_types       for all using (true) with check (true);
create policy "public all" on scores         for all using (true) with check (true);
create policy "public all" on mixer_channels for all using (true) with check (true);
