-- 既存プロジェクトの SQL Editor で一度だけ実行してください。
-- また行きたいを 0=なし / 1=Maybe / 2=Again / 3=Soon に分けます。
-- これまでオンだった記録は Again（2）になります。

alter table public.places
  add column if not exists again_level smallint not null default 0
  check (again_level between 0 and 3);

update public.places
set again_level = 2
where want_again and again_level = 0;
