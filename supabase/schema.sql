-- Supabase ダッシュボードの SQL Editor に貼り付けて一度だけ実行してください。

-- 二人の共有スペース
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'ふたりの思い出',
  anniversary date,
  invite_code text not null unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  created_at timestamptz not null default now()
);

create table if not exists public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  primary key (couple_id, user_id),
  unique (user_id)
);

-- 思い出アイテム（場所・映画・本など）
create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  category text not null default 'place' check (category in ('place', 'movie', 'book', 'food', 'other')),
  status text not null default 'want' check (status in ('want', 'visited')),
  want_again boolean not null default false,
  visited_on date,
  rating smallint check (rating between 1 and 5),
  tags text[] not null default '{}',
  memo text,
  address text,
  lat double precision,
  lng double precision,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists places_couple_id_idx on public.places (couple_id);
create index if not exists places_category_idx on public.places (couple_id, category);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists places_touch_updated_at on public.places;
create trigger places_touch_updated_at
  before update on public.places
  for each row execute function public.touch_updated_at();

-- RLS（自分が所属するペアのデータだけ読み書きできる）
create or replace function public.is_member(cid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.couple_members
    where couple_id = cid and user_id = auth.uid()
  );
$$;

alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.places enable row level security;

drop policy if exists "members read couple" on public.couples;
create policy "members read couple" on public.couples
  for select using (public.is_member(id));

drop policy if exists "members update couple" on public.couples;
create policy "members update couple" on public.couples
  for update using (public.is_member(id)) with check (public.is_member(id));

drop policy if exists "members read members" on public.couple_members;
create policy "members read members" on public.couple_members
  for select using (public.is_member(couple_id));

drop policy if exists "update own member row" on public.couple_members;
create policy "update own member row" on public.couple_members
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "members manage places" on public.places;
create policy "members manage places" on public.places
  for all using (public.is_member(couple_id)) with check (public.is_member(couple_id));

-- ペアの作成と参加（RLS を迂回するため security definer）
create or replace function public.create_couple(p_name text, p_anniversary date, p_display_name text)
returns public.couples
language plpgsql security definer set search_path = public as $$
declare
  c public.couples;
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です';
  end if;
  if exists (select 1 from couple_members where user_id = auth.uid()) then
    raise exception 'すでにペアに参加しています';
  end if;

  insert into couples (name, anniversary)
  values (coalesce(nullif(trim(p_name), ''), 'ふたりの思い出'), p_anniversary)
  returning * into c;

  insert into couple_members (couple_id, user_id, display_name)
  values (c.id, auth.uid(), p_display_name);

  return c;
end;
$$;

create or replace function public.join_couple(p_code text, p_display_name text)
returns public.couples
language plpgsql security definer set search_path = public as $$
declare
  c public.couples;
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です';
  end if;
  if exists (select 1 from couple_members where user_id = auth.uid()) then
    raise exception 'すでにペアに参加しています';
  end if;

  select * into c from couples where invite_code = upper(trim(p_code));
  if c.id is null then
    raise exception '招待コードが見つかりません';
  end if;
  if (select count(*) from couple_members where couple_id = c.id) >= 2 then
    raise exception 'このペアはすでに二人そろっています';
  end if;

  insert into couple_members (couple_id, user_id, display_name)
  values (c.id, auth.uid(), p_display_name);

  return c;
end;
$$;

revoke execute on function public.create_couple(text, date, text) from anon;
revoke execute on function public.join_couple(text, text) from anon;

-- リアルタイム同期
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'places'
  ) then
    alter publication supabase_realtime add table public.places;
  end if;
end;
$$;
