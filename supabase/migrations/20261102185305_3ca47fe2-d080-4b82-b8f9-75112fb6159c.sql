create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.shopping_lists to authenticated;
grant all on public.shopping_lists to service_role;
alter table public.shopping_lists enable row level security;
create policy "Owners manage their shopping lists" on public.shopping_lists for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  part_id text not null,
  part_title text not null,
  price_eur numeric not null default 0,
  store text not null default '',
  quantity integer not null default 1 check (quantity between 1 and 99),
  bought boolean not null default false,
  created_at timestamptz not null default now(),
  unique (list_id, part_id)
);
grant select, insert, update, delete on public.shopping_list_items to authenticated;
grant all on public.shopping_list_items to service_role;
alter table public.shopping_list_items enable row level security;
create policy "Owners manage their list items" on public.shopping_list_items for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and exists (select 1 from public.shopping_lists l where l.id = list_id and l.user_id = auth.uid()));

create trigger touch_shopping_lists before update on public.shopping_lists
  for each row execute function public.touch_account_updated_at();

delete from public.watchbox_favorites a using public.watchbox_favorites b
  where a.user_id is not null and a.user_id = b.user_id and a.part_id = b.part_id and a.created_at > b.created_at;
create unique index if not exists watchbox_favorites_user_part on public.watchbox_favorites(user_id, part_id);