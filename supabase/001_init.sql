-- Raphamaths v0.1 — à exécuter UNE SEULE FOIS dans SQL Editor Supabase.
-- Un seul utilisateur (celui dont le UUID a été inscrit dans app_access) peut
-- consulter et enregistrer les tentatives. N'expose aucune clé service_role.

create extension if not exists pgcrypto;

create table if not exists public.app_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  singleton boolean not null default true unique check (singleton),
  created_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  skill_id text not null,
  exercise_id uuid not null,
  mode text not null check (mode in ('concrete', 'visual', 'symbolic')),
  success boolean not null,
  hints_used integer not null default 0 check (hints_used >= 0),
  answer_input text not null default '',
  expected_answer text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists attempts_user_date_idx
  on public.attempts(user_id, created_at desc);
create index if not exists attempts_skill_date_idx
  on public.attempts(user_id, skill_id, created_at desc);

alter table public.app_access enable row level security;
alter table public.attempts enable row level security;

-- Contrôle d'accès en lecture SEULEMENT. Seul le propriétaire du projet peut
-- attribuer un accès via le SQL Editor (service_role / propriétaire DB).
drop policy if exists "own_access_read" on public.app_access;
create policy "own_access_read" on public.app_access
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Ajout/lecture des tentatives UNIQUEMENT si l'utilisateur a été autorisé.
-- Un utilisateur authentifié supplémentaire n'obtient pas l'accès aux données.
drop policy if exists "attempts_read" on public.attempts;
create policy "attempts_read" on public.attempts
  for select to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.app_access a where a.user_id = (select auth.uid()))
  );

drop policy if exists "attempts_insert" on public.attempts;
create policy "attempts_insert" on public.attempts
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.app_access a where a.user_id = (select auth.uid()))
  );

-- Aucune politique UPDATE ou DELETE : historique append-only côté navigateur.
-- Pour attribuer l'accès, remplace cet UUID par celui créé dans Authentication > Users :
-- insert into public.app_access(user_id)
-- values ('00000000-0000-0000-0000-000000000000')
-- on conflict do nothing;

-- Les permissions SQL sont distinctes de la RLS.
revoke all on public.app_access from anon;
revoke all on public.app_access from authenticated;
grant select on public.app_access to authenticated;
revoke all on public.attempts from anon;
revoke all on public.attempts from authenticated;
grant select, insert on public.attempts to authenticated;
