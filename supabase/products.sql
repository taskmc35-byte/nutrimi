-- Nutrimi — memoria condivisa dei prodotti inseriti a mano (per codice a barre).
-- Tutti gli utenti con account leggono il catalogo; si scrive solo con la funzione nm_save_product,
-- che controlla i valori. Si salvano solo nome, marca, codice e valori nutrizionali: nessun dato personale.
-- Si può rieseguire senza danni.

create table if not exists public.products (
  code text primary key check (code ~ '^[0-9]{8,14}$'),
  name text not null check (length(name) between 1 and 120),
  brand text check (brand is null or length(brand) <= 80),
  grams numeric check (grams is null or (grams >= 0 and grams <= 100000)),
  n jsonb not null,
  al text[] not null default '{}',
  lat boolean not null default false,
  food_id text,
  cat text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_created_by_day_idx on public.products (created_by, created_at);

alter table public.products enable row level security;
drop policy if exists products_read on public.products;
create policy products_read on public.products for select to authenticated using (true);
revoke insert, update, delete on public.products from anon, authenticated;

create or replace function public.nm_save_product(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  c text := trim(coalesce(p->>'code', ''));
  nm text := left(trim(coalesce(p->>'name', '')), 120);
  n jsonb := coalesce(p->'n', '{}'::jsonb);
  k text; v numeric; clean jsonb := '{}'::jsonb;
  al text[]; ex public.products;
  allowed text[] := array['glutine','crostacei','uova','pesce','arachidi','soia','latte','frutta_guscio','sedano','senape','sesamo','solfiti','lupini','molluschi'];
begin
  if uid is null then raise exception 'Accesso richiesto'; end if;
  if c !~ '^[0-9]{8,14}$' then raise exception 'Codice non valido'; end if;
  if nm = '' then raise exception 'Nome mancante'; end if;
  perform pg_advisory_xact_lock(hashtext('nmp:' || uid::text));
  if (select count(*) from public.products where created_by = uid and created_at > now() - interval '1 day') >= 60 then
    raise exception 'Troppi prodotti inseriti oggi';
  end if;
  -- valori per 100 g, solo numeri plausibili
  foreach k in array array['kcal','p','c','s','f','sat','fib'] loop
    begin v := (n->>k)::numeric; exception when others then v := null; end;
    if v is null then v := 0; end if;
    if v < 0 or (k = 'kcal' and v > 900) or (k <> 'kcal' and v > 100) then raise exception 'Valore non valido: %', k; end if;
    clean := clean || jsonb_build_object(k, round(v, 1));
  end loop;
  if (clean->>'p')::numeric + (clean->>'c')::numeric + (clean->>'f')::numeric > 105 then raise exception 'Valori incoerenti'; end if;
  if (clean->>'s')::numeric > (clean->>'c')::numeric + 0.5 or (clean->>'sat')::numeric > (clean->>'f')::numeric + 0.5 then raise exception 'Valori incoerenti'; end if;
  clean := clean || '{"A":0,"C":0,"D":0,"E":0,"B12":0}'::jsonb;
  select coalesce(array_agg(x), '{}') into al from jsonb_array_elements_text(coalesce(p->'al', '[]'::jsonb)) x where x = any(allowed);

  select * into ex from public.products where code = c;
  if ex.code is not null and ex.created_by is distinct from uid then
    return jsonb_build_object('ok', false, 'reason', 'Prodotto già presente');
  end if;
  insert into public.products (code, name, brand, grams, n, al, lat, food_id, cat, created_by)
  values (c, nm, nullif(left(trim(coalesce(p->>'brand', '')), 80), ''),
          case when (p->>'grams') ~ '^[0-9]+(\.[0-9]+)?$' and (p->>'grams')::numeric <= 100000 then (p->>'grams')::numeric end,
          clean, al, coalesce((p->>'lat')::boolean, 'latte' = any(al)), left(p->>'foodId', 40), left(p->>'cat', 40), uid)
  on conflict (code) do update set name = excluded.name, brand = excluded.brand, grams = excluded.grams, n = excluded.n, al = excluded.al,
    lat = excluded.lat, food_id = excluded.food_id, cat = excluded.cat, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;

revoke execute on function public.nm_save_product(jsonb) from public, anon;
grant execute on function public.nm_save_product(jsonb) to authenticated;
