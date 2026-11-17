-- Nutrimi — codice casa a prova di tentativi
-- Da eseguire nell'SQL Editor di Supabase DOPO schema.sql. Si può rieseguire senza danni.
--
-- Prima: codice di 6 caratteri e tentativi illimitati → chi si registrava poteva provare codici
-- a raffica fino a entrare nella casa di qualcun altro (dispensa, diario, profili).
-- Ora: massimo 10 codici sbagliati all'ora per account, e le case nuove hanno un codice di 10 caratteri.
-- I codici delle case esistenti NON cambiano: chi ce l'ha può ancora usarlo.

-- Codici nuovi: 10 caratteri senza lettere che si confondono (niente 0/O, 1/I/L)
create or replace function public.nm_nuovo_codice() returns text
language sql volatile set search_path = public, extensions as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + (get_byte(b, i) % 31), 1), '' order by i)
  from (select gen_random_bytes(10) as b) x, generate_series(0, 9) as i;
$$;
alter table public.households alter column invite_code set default public.nm_nuovo_codice();

-- Registro dei codici sbagliati (nessuno lo legge dall'app)
create table if not exists public.join_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists join_attempts_user_time on public.join_attempts (user_id, created_at desc);
alter table public.join_attempts enable row level security;
revoke all on public.join_attempts from anon, authenticated;

-- Entra in una casa con il codice.
-- Codice sbagliato → restituisce NULL (niente errore, così il tentativo resta registrato).
-- Troppi codici sbagliati nell'ultima ora → errore "Troppi tentativi".
create or replace function public.join_household(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare hid uuid; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Accesso richiesto'; end if;
  perform pg_advisory_xact_lock(hashtext('nmj:' || uid::text));
  if (select count(*) from public.join_attempts where user_id = uid and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Troppi tentativi: riprova tra un''ora.';
  end if;
  select id into hid from public.households where invite_code = upper(trim(coalesce(p_code, '')));
  if hid is null then
    insert into public.join_attempts (user_id) values (uid);
    delete from public.join_attempts where created_at < now() - interval '7 days';
    return null;
  end if;
  insert into public.household_members(household_id, user_id) values (hid, uid) on conflict do nothing;
  return hid;
end $$;

-- Solo chi ha fatto l'accesso può chiamare queste funzioni
revoke execute on function public.join_household(text) from public, anon;
revoke execute on function public.create_household(text) from public, anon;
revoke execute on function public.nm_nuovo_codice() from public, anon, authenticated;
grant execute on function public.join_household(text) to authenticated;
grant execute on function public.create_household(text) to authenticated;
