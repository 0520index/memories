-- すでに schema.sql を実行済みの場合、このファイルだけ SQL Editor で実行してください。

alter table public.places
  add column if not exists category text not null default 'place'
  check (category in ('place', 'movie', 'book', 'food', 'other'));

create index if not exists places_category_idx on public.places (couple_id, category);
