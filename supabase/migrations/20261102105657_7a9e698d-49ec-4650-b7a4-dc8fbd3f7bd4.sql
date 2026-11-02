create extension if not exists "pgcrypto";
create extension if not exists pg_trgm with schema extensions;

-- ===== 000001 ChronoParts schema =====
create table if not exists public.parts_catalog (
  id text primary key, title text not null, brand text not null, category text not null, store text not null,
  origin text not null check (origin in ('oem', 'generic')), price_eur numeric(10,2) not null,
  equivalent_oem_price_eur numeric(10,2), delivery text not null default '3–5d', image text not null, spec text not null,
  compatible_with text[] not null default '{}', oem_ref text, pair_group_id text, custom_url text,
  pro_only boolean not null default false, created_at timestamptz not null default now()
);
grant select on public.parts_catalog to anon, authenticated;
grant all on public.parts_catalog to service_role;
alter table public.parts_catalog enable row level security;
create policy "Public read access for parts_catalog" on public.parts_catalog for select using (true);

create table if not exists public.daily_chollos (
  id text primary key, title text not null, brand text not null, ref text not null,
  platform text not null check (platform in ('eBay', 'Wallapop', 'Chrono24', 'Todocolección')),
  deal_type text not null, price_eur numeric(10,2) not null, market_value_eur numeric(10,2) not null,
  discount_pct integer not null, profit_margin_eur numeric(10,2) not null, chollo_score numeric(3,1) not null,
  condition text not null, location text not null, time_left_or_posted text not null, seller_note text,
  ai_verdict text not null, image text not null, url text not null, pro_only boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.daily_chollos to anon, authenticated;
grant all on public.daily_chollos to service_role;
alter table public.daily_chollos enable row level security;
create policy "Public read access for daily_chollos" on public.daily_chollos for select using (true);

create table if not exists public.watchbox_favorites (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  client_session_id text, part_id text not null, part_title text not null, price_eur numeric(10,2) not null,
  store text not null, created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.watchbox_favorites to authenticated;
grant all on public.watchbox_favorites to service_role;
alter table public.watchbox_favorites enable row level security;

create table if not exists public.price_alerts (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
  client_session_id text, part_id text not null, title text not null, target_eur numeric(10,2) not null,
  whatsapp_enabled boolean not null default true, created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.price_alerts to authenticated;
grant all on public.price_alerts to service_role;
alter table public.price_alerts enable row level security;

create table if not exists public.seo_articles (
  slug text primary key, title text not null, meta_title text not null, meta_description text not null,
  category text not null, read_time text not null, published_at date not null default current_date,
  updated_at date not null default current_date, keywords text[] not null default '{}', excerpt text not null,
  related_model_id text not null, related_search_query text not null,
  sections jsonb not null default '[]'::jsonb, faq jsonb not null default '[]'::jsonb
);
grant select on public.seo_articles to anon, authenticated;
grant all on public.seo_articles to service_role;
alter table public.seo_articles enable row level security;
create policy "Public read access for seo_articles" on public.seo_articles for select using (true);

-- ===== 000002 Marketplace schema =====
create table if not exists public.marketplace_moderators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'moderator' check (role in ('moderator', 'admin')),
  created_at timestamptz not null default now()
);
grant select on public.marketplace_moderators to authenticated;
grant all on public.marketplace_moderators to service_role;
alter table public.marketplace_moderators enable row level security;
create policy "Only moderators can read moderator table" on public.marketplace_moderators for select using (auth.uid() = user_id);

create or replace function public.is_marketplace_moderator(check_user_id uuid)
returns boolean language sql security definer stable set search_path = public
as $$ select exists (select 1 from public.marketplace_moderators where user_id = check_user_id); $$;

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null, owner_display_name text not null,
  owner_joined_at date not null default current_date,
  brand text not null check (char_length(trim(brand)) >= 2), model text not null check (char_length(trim(model)) >= 1),
  reference text, price_eur numeric(10,2) not null check (price_eur > 0 and price_eur <= 2000000),
  condition text not null, 
  movement_type text not null check (movement_type in ('quartz', 'automatic', 'manual', 'other')),
  approx_year integer check (approx_year is null or (approx_year >= 1850 and approx_year <= 2030)),
  description text not null default '', box_included boolean not null default false,
  papers_included boolean not null default false, accessories_notes text,
  approx_location text not null check (char_length(trim(approx_location)) >= 2),
  authenticity_declaration boolean not null default false, known_modifications text not null default '',
  serial_number_masked text, serial_number_private text,
  status text not null default 'draft' check (status in ('draft', 'published', 'paused', 'sold', 'withdrawn')),
  review_status text not null default 'pending' check (review_status in ('pending', 'passed_photo_review', 'manual_review', 'rejected')),
  is_demo boolean not null default false, published_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_listings_public_catalog on public.listings (status, review_status, published_at desc);
create index if not exists idx_listings_brand_ref on public.listings (lower(brand), lower(coalesce(reference, '')));
create index if not exists idx_listings_price on public.listings (price_eur);
create index if not exists idx_listings_owner on public.listings (owner_id, updated_at desc);
grant select on public.listings to anon;
grant select, insert, update, delete on public.listings to authenticated;
grant all on public.listings to service_role;
alter table public.listings enable row level security;
create policy "Public can view published non-rejected listings" on public.listings for select
  using ((status in ('published', 'sold') and review_status <> 'rejected') or auth.uid() = owner_id or public.is_marketplace_moderator(auth.uid()));
create policy "Owners can insert their own listings" on public.listings for insert with check (auth.uid() = owner_id);
create policy "Owners and moderators can update listings" on public.listings for update
  using (auth.uid() = owner_id or public.is_marketplace_moderator(auth.uid()))
  with check (auth.uid() = owner_id or public.is_marketplace_moderator(auth.uid()));
create policy "Owners can delete their draft or withdrawn listings" on public.listings for delete
  using (auth.uid() = owner_id and status in ('draft', 'withdrawn'));

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade, storage_path text not null,
  slot_type text not null default 'extra' check (slot_type in ('dial', 'caseback', 'crown_sides', 'clasp_strap', 'ref_serial', 'extra')),
  caption text, sort_order integer not null default 0 check (sort_order >= 0 and sort_order < 10),
  mime_type text not null default 'image/jpeg' check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  file_size_bytes integer not null default 0 check (file_size_bytes >= 0 and file_size_bytes <= 8388608),
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'flagged')),
  is_sensitive_serial boolean not null default false, created_at timestamptz not null default now()
);
create index if not exists idx_listing_images_listing on public.listing_images (listing_id, sort_order asc);
grant select on public.listing_images to anon;
grant select, insert, update, delete on public.listing_images to authenticated;
grant all on public.listing_images to service_role;
alter table public.listing_images enable row level security;
create policy "Images visible when parent listing is visible and not sensitive serial" on public.listing_images for select
  using (exists (select 1 from public.listings l where l.id = listing_images.listing_id and (
    (l.status in ('published', 'sold') and l.review_status <> 'rejected' and not listing_images.is_sensitive_serial)
    or l.owner_id = auth.uid() or public.is_marketplace_moderator(auth.uid()))));
create policy "Listing owners can manage their listing images" on public.listing_images for all
  using (exists (select 1 from public.listings l where l.id = listing_images.listing_id and l.owner_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_images.listing_id and l.owner_id = auth.uid()));

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(), user_id uuid not null,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(), constraint uq_favorites_user_listing unique (user_id, listing_id)
);
create index if not exists idx_favorites_user on public.favorites (user_id, created_at desc);
grant select, insert, update, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "Users can read and manage only their own favorites" on public.favorites for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null, buyer_name text not null, seller_id uuid not null, seller_name text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint chk_conversations_distinct_participants check (buyer_id <> seller_id),
  constraint uq_conversations_listing_buyer unique (listing_id, buyer_id)
);
create index if not exists idx_conversations_participants on public.conversations (buyer_id, seller_id, updated_at desc);
grant select, insert, update, delete on public.conversations to authenticated;
grant all on public.conversations to service_role;
alter table public.conversations enable row level security;
create policy "Only conversation participants can read conversations" on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Authenticated buyers can start a conversation" on public.conversations for insert
  with check (auth.uid() = buyer_id and buyer_id <> seller_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null, sender_name text not null,
  content text not null check (char_length(trim(content)) >= 1 and char_length(content) <= 2000),
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_conversation on public.messages (conversation_id, created_at asc);
grant select, insert, update, delete on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "Only conversation participants can read messages" on public.messages for select
  using (exists (select 1 from public.conversations c where c.id = messages.conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())));
create policy "Only conversation participants can send messages as themselves" on public.messages for insert
  with check (sender_id = auth.uid() and exists (select 1 from public.conversations c where c.id = messages.conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())));

create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade, reporter_id uuid not null,
  reason text not null check (reason in ('counterfeit_suspicion', 'stolen_photos', 'misleading_description', 'off_platform_scam', 'other')),
  details text not null default '',
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(), resolved_at timestamptz, resolved_by uuid
);
create index if not exists idx_listing_reports_status on public.listing_reports (status, created_at desc);
grant select, insert, update on public.listing_reports to authenticated;
grant all on public.listing_reports to service_role;
alter table public.listing_reports enable row level security;
create policy "Reporters can create reports and moderators can read/manage" on public.listing_reports for select
  using (auth.uid() = reporter_id or public.is_marketplace_moderator(auth.uid()));
create policy "Users can submit listing reports" on public.listing_reports for insert with check (auth.uid() = reporter_id);
create policy "Moderators can update listing reports" on public.listing_reports for update
  using (public.is_marketplace_moderator(auth.uid()));

create table if not exists public.authenticity_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  status text not null check (status in ('pending', 'passed_photo_review', 'manual_review', 'rejected')),
  method text not null check (method in ('automated_slot_check', 'manual_moderator', 'external_ai_service')),
  internal_reasons text not null default '', public_note text not null default '',
  reviewer_id text not null, created_at timestamptz not null default now()
);
create index if not exists idx_authenticity_reviews_listing on public.authenticity_reviews (listing_id, created_at desc);
grant select, insert on public.authenticity_reviews to authenticated;
grant all on public.authenticity_reviews to service_role;
alter table public.authenticity_reviews enable row level security;
create policy "Moderators and listing owners can view review logs" on public.authenticity_reviews for select
  using (public.is_marketplace_moderator(auth.uid()) or exists (select 1 from public.listings l where l.id = authenticity_reviews.listing_id and l.owner_id = auth.uid()));
create policy "Only moderators can insert authenticity reviews" on public.authenticity_reviews for insert
  with check (public.is_marketplace_moderator(auth.uid()));

-- ===== Uploaded file: parts, search alerts, RLS fixes =====
create or replace function public.normalize_token(input text)
returns text language sql immutable set search_path = public
as $$ select regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]', '', 'g'); $$;

create or replace function public.part_type_label(p text)
returns text language sql immutable set search_path = public
as $$
  select case p
    when 'crown' then 'crown corona' when 'crystal' then 'crystal cristal glass'
    when 'bezel' then 'bezel bisel' when 'dial' then 'dial esfera' when 'hands' then 'hands agujas'
    when 'movement' then 'movement movimiento calibre' when 'strap' then 'strap correa'
    else 'pieza part' end;
$$;

alter table public.listings
  add column if not exists listing_type text not null default 'watch',
  add column if not exists part_type text,
  add column if not exists part_origin text,
  add column if not exists part_reference text,
  add column if not exists part_reference_normalized text,
  add column if not exists declared_compatible_with text[] not null default '{}',
  add column if not exists declared_compatible_normalized text[] not null default '{}',
  add column if not exists search_text text not null default '';

alter table public.listings add constraint listings_listing_type_check check (listing_type in ('watch', 'part'));
alter table public.listings add constraint listings_part_type_check
  check (part_type is null or part_type in ('crown', 'crystal', 'bezel', 'dial', 'hands', 'movement', 'strap', 'other'));
alter table public.listings add constraint listings_part_origin_check
  check (part_origin is null or part_origin in ('oem', 'aftermarket', 'unknown'));
alter table public.listings add constraint chk_listings_part_fields
  check (listing_type = 'watch' or (part_type is not null and part_origin is not null));
alter table public.listings add constraint chk_listings_declared_compat_size check (cardinality(declared_compatible_with) <= 20);
alter table public.listings add constraint listings_condition_check
  check (condition in ('new', 'nos', 'excellent', 'good', 'fair', 'for_parts'));

create index if not exists idx_listings_part_catalog on public.listings (listing_type, status, review_status, is_demo, published_at desc);
create index if not exists idx_listings_part_ref on public.listings (part_reference_normalized) where listing_type = 'part';
create index if not exists idx_listings_part_compat on public.listings using gin (declared_compatible_normalized);
create index if not exists idx_listings_search_trgm on public.listings using gin (search_text extensions.gin_trgm_ops);

create or replace function public.enforce_listing_security()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  img_count integer;
begin
  new.updated_at := now();
  new.part_reference_normalized := nullif(public.normalize_token(new.part_reference), '');
  new.declared_compatible_normalized := array(
    select distinct n from (select public.normalize_token(x) as n from unnest(new.declared_compatible_with) as x) s where n <> ''
  );
  new.search_text := public.normalize_token(concat_ws(' ',
    new.brand, new.model, coalesce(new.part_reference, new.reference),
    array_to_string(new.declared_compatible_with, ' '),
    case when new.listing_type = 'part' then public.part_type_label(new.part_type) end
  ));

  if tg_op = 'INSERT' then
    if not public.is_marketplace_moderator(auth.uid()) then
      new.review_status := 'pending';
    end if;
    if new.listing_type = 'part' and new.status = 'published' then
      raise exception 'Una pieza se crea como borrador: añade las fotos y publícala después.';
    end if;
    if new.status = 'published' then
      if not new.authenticity_declaration then
        raise exception 'Authenticity and modification declaration is required to publish.';
      end if;
      new.published_at := coalesce(new.published_at, now());
    end if;
  elsif tg_op = 'UPDATE' then
    if new.review_status is distinct from old.review_status and not public.is_marketplace_moderator(auth.uid()) then
      raise exception 'Forbidden: review_status can only be updated by backend moderation.';
    end if;
    if new.listing_type is distinct from old.listing_type then
      raise exception 'El tipo de anuncio (reloj o pieza) no se puede cambiar.';
    end if;
    if new.status = 'published' and old.status <> 'published' then
      if not new.authenticity_declaration then
        raise exception 'Authenticity and modification declaration is required to publish.';
      end if;
      if new.listing_type = 'part' then
        select count(*) into img_count from public.listing_images where listing_id = new.id;
        if img_count < 1 or img_count > 6 then
          raise exception 'Una pieza necesita entre 1 y 6 fotos para publicarse (tiene %).', img_count;
        end if;
      end if;
      new.published_at := coalesce(old.published_at, now());
    end if;
  end if;

  if new.serial_number_private is not null and char_length(trim(new.serial_number_private)) > 0 then
    if char_length(trim(new.serial_number_private)) <= 3 then
      new.serial_number_masked := '***';
    else
      new.serial_number_masked := substring(trim(new.serial_number_private) from 1 for 2) || '••••' || right(trim(new.serial_number_private), 2);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_listing_security on public.listings;
create trigger trg_enforce_listing_security before insert or update on public.listings
  for each row execute function public.enforce_listing_security();

create or replace view public.public_part_listings with (security_invoker = true) as
select id, owner_display_name, brand, model, part_type, part_origin, part_reference, part_reference_normalized,
  declared_compatible_with, declared_compatible_normalized, search_text, price_eur, condition, description,
  approx_location, published_at, created_at
from public.listings
where listing_type = 'part' and status = 'published' and review_status <> 'rejected' and is_demo = false;
grant select on public.public_part_listings to anon, authenticated;

create table if not exists public.search_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null check (char_length(trim(query)) between 2 and 120),
  query_tokens text[] not null default '{}', active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists uq_search_alerts_user_query on public.search_alerts (user_id, lower(trim(query)));
create index if not exists idx_search_alerts_active on public.search_alerts (active) where active;
grant select, insert, update, delete on public.search_alerts to authenticated;
grant all on public.search_alerts to service_role;

create or replace function public.prepare_search_alert()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.query_tokens := array(
    select t from (select public.normalize_token(w) as t from regexp_split_to_table(lower(new.query), '\s+') as w) s
    where char_length(t) >= 2
  );
  if cardinality(new.query_tokens) = 0 then
    raise exception 'La búsqueda necesita al menos una palabra de 2 o más caracteres.';
  end if;
  if tg_op = 'INSERT' and (select count(*) from public.search_alerts where user_id = new.user_id and active) >= 20 then
    raise exception 'Máximo 20 alertas de búsqueda activas.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prepare_search_alert on public.search_alerts;
create trigger trg_prepare_search_alert before insert or update of query on public.search_alerts
  for each row execute function public.prepare_search_alert();

alter table public.search_alerts enable row level security;
create policy "Users manage only their own search alerts" on public.search_alerts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('search_alert_match')),
  alert_id uuid references public.search_alerts(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(), read_at timestamptz,
  constraint uq_notifications_alert_listing unique (alert_id, listing_id)
);
create index if not exists idx_notifications_user on public.notifications (user_id, created_at desc);
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "Users read only their own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users mark their own notifications as read" on public.notifications for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.notify_search_alerts()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.listing_type = 'part' and new.status = 'published' and not new.is_demo and new.review_status <> 'rejected'
     and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    insert into public.notifications (user_id, kind, alert_id, listing_id)
    select a.user_id, 'search_alert_match', a.id, new.id
    from public.search_alerts a
    where a.active and a.user_id <> new.owner_id and cardinality(a.query_tokens) > 0
      and not exists (select 1 from unnest(a.query_tokens) as t where position(t in new.search_text) = 0)
    on conflict (alert_id, listing_id) do nothing;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_notify_search_alerts on public.listings;
create trigger trg_notify_search_alerts after insert or update of status on public.listings
  for each row execute function public.notify_search_alerts();

create policy "Users manage only their own watchbox favorites" on public.watchbox_favorites for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage only their own price alerts" on public.price_alerts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);