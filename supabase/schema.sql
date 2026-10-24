-- Nutrimi — schema del database Supabase
-- Incolla tutto in Supabase → SQL Editor → New query → Run. Si può rieseguire senza danni.

create extension if not exists pgcrypto;

-- Case (nuclei familiari) e membri
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Casa',
  invite_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- true se l'utente collegato fa parte della casa
create or replace function public.is_member(h uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.household_members where household_id = h and user_id = auth.uid());
$$;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
drop policy if exists households_read on public.households;
create policy households_read on public.households for select using (public.is_member(id));
drop policy if exists members_read on public.household_members;
create policy members_read on public.household_members for select using (public.is_member(household_id));

-- Crea una casa e ci aggiunge l'utente
create or replace function public.create_household(p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  if auth.uid() is null then raise exception 'Accesso richiesto'; end if;
  insert into public.households(name) values (coalesce(nullif(trim(p_name), ''), 'Casa')) returning id into hid;
  insert into public.household_members(household_id, user_id) values (hid, auth.uid());
  return hid;
end $$;

-- Entra in una casa esistente con il codice
create or replace function public.join_household(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  if auth.uid() is null then raise exception 'Accesso richiesto'; end if;
  select id into hid from public.households where invite_code = upper(trim(p_code));
  if hid is null then raise exception 'Codice non valido'; end if;
  insert into public.household_members(household_id, user_id) values (hid, auth.uid()) on conflict do nothing;
  return hid;
end $$;

grant execute on function public.create_household(text) to authenticated;
grant execute on function public.join_household(text) to authenticated;

-- Dati della casa: profili, lista spesa, dispensa, diario pasti, ricette personali.
-- Ogni riga contiene i dati dell'app in formato JSON; solo i membri della casa li vedono.
do $$
declare t text;
begin
  foreach t in array array['profiles', 'shopping', 'pantry', 'meals', 'custom_recipes'] loop
    execute format('create table if not exists public.%I (
      id text primary key,
      household_id uuid not null references public.households(id) on delete cascade,
      data jsonb not null,
      updated_at timestamptz not null default now())', t);
    execute format('create index if not exists %I on public.%I (household_id)', t || '_household_idx', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_members', t);
    execute format('create policy %I on public.%I for all using (public.is_member(household_id)) with check (public.is_member(household_id))', t || '_members', t);
    execute format('alter table public.%I replica identity full', t);
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- Ricette importate ogni settimana (lette da tutti gli utenti, scritte solo dallo script di aggiornamento)
create table if not exists public.recipes (
  id text primary key,
  data jsonb not null,
  source_url text not null,
  source_name text,
  active boolean not null default true,
  imported_at timestamptz not null default now()
);
alter table public.recipes enable row level security;
drop policy if exists recipes_read on public.recipes;
create policy recipes_read on public.recipes for select to authenticated using (active);

-- Notifiche scadenze: iscrizioni dei telefoni (una per dispositivo)
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  sub jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists push_own on public.push_subscriptions;
create policy push_own on public.push_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_member(household_id));

-- Registro degli avvisi già inviati (usato solo dallo script delle 9:00)
create table if not exists public.push_sent (
  item_id text not null,
  exp date not null,
  sent_on date not null default current_date,
  primary key (item_id, exp)
);
alter table public.push_sent enable row level security;
