-- すでに schema.sql を実行済みの場合、このファイルだけ SQL Editor で実行してください。
-- メモに書いてあった URL は links へ移します。

alter table public.places
  add column if not exists links text[] not null default '{}';

update public.places p
set links = sub.urls
from (
  select id, array_agg(distinct url) as urls
  from (
    select id, (regexp_matches(memo, $pat$https?://[^[:space:]]+$pat$, 'g'))[1] as url
    from public.places
    where memo is not null
  ) matched
  group by id
) sub
where p.id = sub.id
  and cardinality(p.links) = 0;
