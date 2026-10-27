-- Nutrimi — punti, negozio e avatar
-- I punti li assegna solo il database (funzioni nm_award / nm_buy): il telefono chiede, il server controlla le regole.
-- Si può rieseguire senza danni.

-- registro dei punti guadagnati (e degli sprechi, a 0 punti, per la sfida settimanale)
create table if not exists public.reward_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  kind text not null check (kind in ('scan', 'cook', 'rescue', 'diary', 'streak', 'week', 'waste')),
  ref text not null,
  points int not null check (points >= 0),
  day date not null default ((now() at time zone 'Europe/Rome')::date),
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref)
);
create index if not exists reward_events_user_day_idx on public.reward_events (user_id, day);
create index if not exists reward_events_house_day_idx on public.reward_events (household_id, day) where kind = 'waste';

-- catalogo con i prezzi ufficiali (gli oggetti a 0 punti sono inclusi per tutti)
create table if not exists public.store_items (
  id text primary key,
  cat text not null,
  price int not null check (price >= 0),
  active boolean not null default true
);

-- oggetti comprati
create table if not exists public.owned_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references public.store_items(id),
  price int not null,
  bought_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.reward_events enable row level security;
alter table public.store_items enable row level security;
alter table public.owned_items enable row level security;
drop policy if exists reward_events_own on public.reward_events;
create policy reward_events_own on public.reward_events for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists store_items_read on public.store_items;
create policy store_items_read on public.store_items for select to authenticated using (true);
drop policy if exists owned_items_own on public.owned_items;
create policy owned_items_own on public.owned_items for select to authenticated using (user_id = (select auth.uid()));
-- nessuna scrittura diretta: solo tramite le funzioni qui sotto
revoke insert, update, delete on public.reward_events, public.owned_items, public.store_items from anon, authenticated;

create or replace function public.nm_balance(p_user uuid) returns int
language sql stable security definer set search_path = public as $$
  select coalesce((select sum(points) from public.reward_events where user_id = p_user), 0)::int
       - coalesce((select sum(price) from public.owned_items where user_id = p_user), 0)::int;
$$;
revoke execute on function public.nm_balance(uuid) from public, anon, authenticated;

-- giorni di fila con almeno un pasto nel diario, fino a oggi (o fino a ieri se oggi non c'è ancora)
create or replace function public.nm_streak(p_user uuid) returns int
language plpgsql stable security definer set search_path = public as $$
declare d date := (now() at time zone 'Europe/Rome')::date; n int := 0;
begin
  if not exists (select 1 from public.reward_events where user_id = p_user and kind = 'diary' and day = d) then d := d - 1; end if;
  while exists (select 1 from public.reward_events where user_id = p_user and kind = 'diary' and day = d) loop
    n := n + 1; d := d - 1;
  end loop;
  return n;
end $$;
revoke execute on function public.nm_streak(uuid) from public, anon, authenticated;

create or replace function public.nm_award(p_kind text, p_ref text default '') returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  hid uuid;
  today date := (now() at time zone 'Europe/Rome')::date;
  pts int; cap int; used int; ok boolean := false; why text := null;
  r text := coalesce(p_ref, '');
  exp date; wk_start date; wk_end date; s int; bonus int := 0; got int := 0;
begin
  if uid is null then raise exception 'Accesso richiesto'; end if;
  select household_id into hid from public.household_members where user_id = uid order by created_at limit 1;
  if hid is null then raise exception 'Nessuna casa'; end if;
  perform pg_advisory_xact_lock(hashtext('nm:' || uid::text));

  if p_kind = 'scan' then
    pts := 5; cap := 10;
    ok := r ~ '^[0-9]{8,14}$' and exists (select 1 from public.pantry where household_id = hid and data->>'code' = r);
    why := case when ok then null else 'prodotto non trovato in dispensa' end;
  elsif p_kind = 'cook' then
    pts := 15; cap := 3;
    ok := exists (select 1 from public.meals where household_id = hid and id = r and data->>'recipeId' is not null
                  and (data->>'date') between (today - 1)::text and (today + 1)::text);
    why := case when ok then null else 'pasto non trovato' end;
  elsif p_kind = 'rescue' then
    pts := 20; cap := 5;
    begin exp := split_part(r, ':', 2)::date; exception when others then exp := null; end;
    ok := exp is not null and exp between today and today + 3
          and exists (select 1 from public.reward_events where user_id = uid and day = today and kind in ('cook', 'diary'));
    why := case when ok then null else 'non era in scadenza' end;
  elsif p_kind = 'diary' then
    pts := 3; cap := 1; r := today::text;
    ok := exists (select 1 from public.meals where household_id = hid and data->>'date' = r);
    why := case when ok then null else 'diario vuoto' end;
  elsif p_kind = 'waste' then
    pts := 0; cap := null; ok := length(r) between 1 and 80;
  elsif p_kind = 'week' then
    -- settimana scorsa (lunedì-domenica)
    wk_start := date_trunc('week', today)::date - 7; wk_end := wk_start + 6;
    r := to_char(wk_start, 'IYYY-"W"IW'); pts := 50; cap := null;
    ok := exists (select 1 from public.reward_events where user_id = uid and day between wk_start and wk_end and kind in ('cook', 'diary'))
          and not exists (select 1 from public.reward_events where household_id = hid and kind = 'waste' and day between wk_start and wk_end);
    why := case when ok then null else 'non idonea' end;
  else
    raise exception 'Tipo non valido';
  end if;

  if ok and cap is not null then
    select count(*) into used from public.reward_events where user_id = uid and kind = p_kind and day = today;
    if used >= cap then ok := false; why := 'limite di oggi raggiunto'; end if;
  end if;

  if ok then
    insert into public.reward_events (user_id, household_id, kind, ref, points) values (uid, hid, p_kind, r, pts)
      on conflict (user_id, kind, ref) do nothing;
    if found then got := pts; else ok := false; why := 'già ottenuto'; end if;
  end if;

  -- premio per la serie di giorni
  if ok and p_kind = 'diary' then
    s := public.nm_streak(uid);
    bonus := case when s = 3 then 10 when s = 7 then 30 when s = 14 then 60 when s >= 30 and s % 30 = 0 then 150 else 0 end;
    if bonus > 0 then
      insert into public.reward_events (user_id, household_id, kind, ref, points) values (uid, hid, 'streak', today::text, bonus)
        on conflict do nothing;
    end if;
  end if;

  return jsonb_build_object('ok', ok, 'kind', p_kind, 'points', got, 'bonus', bonus, 'streak', public.nm_streak(uid),
    'balance', public.nm_balance(uid), 'reason', why);
end $$;

create or replace function public.nm_buy(p_item text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); it public.store_items; bal int;
begin
  if uid is null then raise exception 'Accesso richiesto'; end if;
  perform pg_advisory_xact_lock(hashtext('nm:' || uid::text));
  select * into it from public.store_items where id = p_item and active;
  if it.id is null then raise exception 'Oggetto non disponibile'; end if;
  if it.price = 0 or exists (select 1 from public.owned_items where user_id = uid and item_id = it.id) then
    return jsonb_build_object('ok', true, 'balance', public.nm_balance(uid), 'already', true);
  end if;
  bal := public.nm_balance(uid);
  if bal < it.price then
    return jsonb_build_object('ok', false, 'balance', bal, 'reason', 'Punti insufficienti');
  end if;
  insert into public.owned_items (user_id, item_id, price) values (uid, it.id, it.price);
  return jsonb_build_object('ok', true, 'balance', bal - it.price);
end $$;

create or replace function public.nm_wallet() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); today date := (now() at time zone 'Europe/Rome')::date;
begin
  if uid is null then raise exception 'Accesso richiesto'; end if;
  return jsonb_build_object(
    'balance', public.nm_balance(uid),
    'today', coalesce((select sum(points) from public.reward_events where user_id = uid and day = today), 0),
    'total', coalesce((select sum(points) from public.reward_events where user_id = uid), 0),
    'streak', public.nm_streak(uid),
    'owned', coalesce((select jsonb_agg(item_id) from public.owned_items where user_id = uid), '[]'::jsonb),
    'recent', coalesce((select jsonb_agg(x) from (select kind, points, day, created_at from public.reward_events
                where user_id = uid and points > 0 order by created_at desc limit 15) x), '[]'::jsonb));
end $$;

revoke execute on function public.nm_award(text, text), public.nm_buy(text), public.nm_wallet() from public, anon;
grant execute on function public.nm_award(text, text), public.nm_buy(text), public.nm_wallet() to authenticated;

-- catalogo (generato da js/data/store.js)
insert into public.store_items (id, cat, price) values
  ('skin:ffdbb4','skin',0),
  ('skin:edb98a','skin',0),
  ('skin:d08b5b','skin',0),
  ('skin:ae5d29','skin',0),
  ('skin:614335','skin',0),
  ('top:shortFlat','top',0),
  ('top:shortRound','top',0),
  ('top:shortWaved','top',0),
  ('top:theCaesar','top',0),
  ('top:sides','top',0),
  ('top:straight01','top',0),
  ('top:straight02','top',0),
  ('top:bob','top',0),
  ('top:bun','top',0),
  ('top:curly','top',0),
  ('top:longButNotTooLong','top',0),
  ('top:fro','top',0),
  ('top:dreads01','top',0),
  ('top:hijab','top',0),
  ('top:turban','top',0),
  ('top:shortCurly','top',40),
  ('top:theCaesarAndSidePart','top',40),
  ('top:curvy','top',50),
  ('top:shavedSides','top',50),
  ('top:straightAndStrand','top',50),
  ('top:dreads','top',50),
  ('top:dreads02','top',50),
  ('top:frizzle','top',50),
  ('top:shaggy','top',50),
  ('top:frida','top',60),
  ('top:miaWallace','top',60),
  ('top:froBand','top',60),
  ('top:bigHair','top',70),
  ('top:shaggyMullet','top',80),
  ('top:winterHat1','top',70),
  ('top:winterHat02','top',70),
  ('top:winterHat03','top',80),
  ('top:winterHat04','top',80),
  ('top:hat','top',90),
  ('hairColor:2c1b18','hairColor',0),
  ('hairColor:4a312c','hairColor',0),
  ('hairColor:724133','hairColor',0),
  ('hairColor:a55728','hairColor',0),
  ('hairColor:b58143','hairColor',0),
  ('hairColor:d6b370','hairColor',0),
  ('hairColor:ecdcbf','hairColor',0),
  ('hairColor:e8e1e1','hairColor',0),
  ('hairColor:c93305','hairColor',40),
  ('hairColor:f59797','hairColor',60),
  ('hairColor:a7ffc4','hairColor',100),
  ('hairColor:3d7bff','hairColor',100),
  ('hairColor:ffc83d','hairColor',120),
  ('facialHair:none','facialHair',0),
  ('facialHair:beardLight','facialHair',0),
  ('facialHair:beardMedium','facialHair',0),
  ('facialHair:beardMajestic','facialHair',80),
  ('facialHair:moustacheFancy','facialHair',70),
  ('facialHair:moustacheMagnum','facialHair',70),
  ('clothing:shirtCrewNeck','clothing',0),
  ('clothing:hoodie','clothing',0),
  ('clothing:shirtScoopNeck','clothing',40),
  ('clothing:shirtVNeck','clothing',40),
  ('clothing:graphicShirt','clothing',60),
  ('clothing:collarAndSweater','clothing',80),
  ('clothing:overall','clothing',90),
  ('clothing:blazerAndShirt','clothing',120),
  ('clothing:blazerAndSweater','clothing',120),
  ('clothesColor:262e33','clothesColor',0),
  ('clothesColor:e6e6e6','clothesColor',0),
  ('clothesColor:3c4f5c','clothesColor',0),
  ('clothesColor:65c9ff','clothesColor',0),
  ('clothesColor:ff5c5c','clothesColor',40),
  ('clothesColor:a7ffc4','clothesColor',40),
  ('clothesColor:ffafb9','clothesColor',40),
  ('clothesColor:ff488e','clothesColor',60),
  ('clothesColor:2a5fd6','clothesColor',50),
  ('clothesColor:3d7bff','clothesColor',50),
  ('clothesColor:ffc83d','clothesColor',80),
  ('clothingGraphic:bear','clothingGraphic',0),
  ('clothingGraphic:deer','clothingGraphic',40),
  ('clothingGraphic:hola','clothingGraphic',40),
  ('clothingGraphic:cumbia','clothingGraphic',40),
  ('clothingGraphic:pizza','clothingGraphic',50),
  ('clothingGraphic:skull','clothingGraphic',50),
  ('clothingGraphic:skullOutline','clothingGraphic',50),
  ('clothingGraphic:diamond','clothingGraphic',60),
  ('accessories:none','accessories',0),
  ('accessories:prescription01','accessories',0),
  ('accessories:prescription02','accessories',0),
  ('accessories:round','accessories',0),
  ('accessories:eyepatch','accessories',70),
  ('accessories:sunglasses','accessories',80),
  ('accessories:wayfarers','accessories',90),
  ('accessories:kurt','accessories',120),
  ('eyes:default','eyes',0),
  ('eyes:happy','eyes',0),
  ('eyes:squint','eyes',30),
  ('eyes:side','eyes',30),
  ('eyes:surprised','eyes',30),
  ('eyes:wink','eyes',40),
  ('eyes:eyeRoll','eyes',40),
  ('eyes:winkWacky','eyes',60),
  ('eyes:hearts','eyes',100),
  ('eyebrows:default','eyebrows',0),
  ('eyebrows:defaultNatural','eyebrows',0),
  ('eyebrows:flatNatural','eyebrows',20),
  ('eyebrows:raisedExcited','eyebrows',30),
  ('eyebrows:raisedExcitedNatural','eyebrows',30),
  ('eyebrows:upDown','eyebrows',30),
  ('eyebrows:upDownNatural','eyebrows',30),
  ('eyebrows:unibrowNatural','eyebrows',50),
  ('mouth:smile','mouth',0),
  ('mouth:default','mouth',0),
  ('mouth:serious','mouth',20),
  ('mouth:concerned','mouth',20),
  ('mouth:twinkle','mouth',30),
  ('mouth:tongue','mouth',50),
  ('mouth:eating','mouth',60),
  ('bg:notte','bg',0),
  ('bg:cielo','bg',60),
  ('bg:menta','bg',60),
  ('bg:tramonto','bg',100),
  ('bg:oro','bg',150),
  ('frame:none','frame',0),
  ('frame:blu','frame',120),
  ('frame:oro','frame',150),
  ('frame:foglia','frame',200),
  ('frame:arcobaleno','frame',250),
  ('theme:classico','theme',0),
  ('theme:smeraldo','theme',300),
  ('theme:corallo','theme',300),
  ('theme:viola','theme',300),
  ('theme:oro','theme',400)
on conflict (id) do update set cat = excluded.cat, price = excluded.price, active = true;
