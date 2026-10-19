-- Ejecutar una vez en Supabase > SQL Editor.
-- La clave public/anon es segura para frontend SOLO con RLS correctamente configurado.
create table if not exists public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 settings jsonb not null default '{}'::jsonb
);
create table if not exists public.foods (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null,
 name text not null,
 meal text not null,
 calories numeric(10,2) not null check (calories >= 0),
 protein numeric(10,2) not null check (protein >= 0),
 carbs numeric(10,2) not null check (carbs >= 0),
 fat numeric(10,2) not null check (fat >= 0),
 created_at timestamptz not null default now()
);
create table if not exists public.weights (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null,
 kg numeric(6,2) not null check (kg > 0),
 created_at timestamptz not null default now()
);
create table if not exists public.activities (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null,
 name text not null,
 minutes integer not null check (minutes > 0),
 notes text not null default '',
 created_at timestamptz not null default now()
);
create table if not exists public.supplement_logs (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null,
 supplement_id text not null,
 created_at timestamptz not null default now(),
 unique(user_id,day,supplement_id)
);
create index if not exists foods_user_day on public.foods(user_id,day);
create index if not exists weights_user_day on public.weights(user_id,day);
create index if not exists activities_user_day on public.activities(user_id,day);
create index if not exists supplement_logs_user_day on public.supplement_logs(user_id,day);

alter table public.profiles enable row level security;
alter table public.foods enable row level security;
alter table public.weights enable row level security;
alter table public.activities enable row level security;
alter table public.supplement_logs enable row level security;

-- Cada usuario solo puede ver y modificar sus propios datos.
do $$
declare t text;
begin
 foreach t in array array['profiles','foods','weights','activities','supplement_logs'] loop
  execute format('drop policy if exists own_data on public.%I', t);
  execute format('create policy own_data on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',t);
 end loop;
end $$;
