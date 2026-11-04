-- 既存プロジェクトの SQL Editor で一度だけ実行してください。
-- 相手に見せない（自分だけ見える）記録を追加できます。

alter table public.places
  add column if not exists is_private boolean not null default false;

drop policy if exists "members manage places" on public.places;
drop policy if exists "members read places" on public.places;
drop policy if exists "members insert places" on public.places;
drop policy if exists "members update places" on public.places;
drop policy if exists "members delete places" on public.places;

create policy "members read places" on public.places
  for select using (
    public.is_member(couple_id)
    and (not is_private or created_by = auth.uid())
  );

create policy "members insert places" on public.places
  for insert with check (
    public.is_member(couple_id)
    and (not is_private or created_by = auth.uid())
  );

create policy "members update places" on public.places
  for update
  using (
    public.is_member(couple_id)
    and (not is_private or created_by = auth.uid())
  )
  with check (
    public.is_member(couple_id)
    and (not is_private or created_by = auth.uid())
  );

create policy "members delete places" on public.places
  for delete using (
    public.is_member(couple_id)
    and (not is_private or created_by = auth.uid())
  );
