-- ChronoParts Marketplace Schema Migration (Standalone-Ready Module)
-- Decoupled from parts_catalog & daily_chollos so Marketplace can be extracted as a standalone App in the future.
-- Includes RLS policies, foreign keys, constraints, indexes, and server-side review_status protection triggers.

create extension if not exists "pgcrypto";

-- 1. User Roles / Moderator Permissions (Server-side RBAC check)
create table if not exists public.marketplace_moderators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'moderator' check (role in ('moderator', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.marketplace_moderators enable row level security;

create policy "Only moderators can read moderator table"
  on public.marketplace_moderators for select
  using (auth.uid() = user_id);

-- Helper function to check moderator status in RLS and triggers
create or replace function public.is_marketplace_moderator(check_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.marketplace_moderators where user_id = check_user_id
  );
$$;

-- 2. Complete Watch Listings (listings)
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  owner_display_name text not null,
  owner_joined_at date not null default current_date,
  brand text not null check (char_length(trim(brand)) >= 2),
  model text not null check (char_length(trim(model)) >= 1),
  reference text,
  price_eur numeric(10,2) not null check (price_eur > 0 and price_eur <= 2000000),
  condition text not null check (condition in ('new', 'excellent', 'good', 'fair', 'for_parts')),
  movement_type text not null check (movement_type in ('quartz', 'automatic', 'manual', 'other')),
  approx_year integer check (approx_year is null or (approx_year >= 1850 and approx_year <= 2030)),
  description text not null default '',
  box_included boolean not null default false,
  papers_included boolean not null default false,
  accessories_notes text,
  approx_location text not null check (char_length(trim(approx_location)) >= 2),
  authenticity_declaration boolean not null default false,
  known_modifications text not null default '',
  serial_number_masked text,
  serial_number_private text,
  status text not null default 'draft' check (status in ('draft', 'published', 'paused', 'sold', 'withdrawn')),
  review_status text not null default 'pending' check (review_status in ('pending', 'passed_photo_review', 'manual_review', 'rejected')),
  is_demo boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listings_public_catalog
  on public.listings (status, review_status, published_at desc);
create index if not exists idx_listings_brand_ref
  on public.listings (lower(brand), lower(coalesce(reference, '')));
create index if not exists idx_listings_price
  on public.listings (price_eur);
create index if not exists idx_listings_owner
  on public.listings (owner_id, updated_at desc);

-- Trigger: Sellers cannot set or tamper with review_status from client; enforce publication rules
create or replace function public.enforce_listing_security()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at := now();

  if tg_op = 'INSERT' then
    if not public.is_marketplace_moderator(auth.uid()) then
      new.review_status := 'pending';
    end if;
    if new.status = 'published' then
      if not new.authenticity_declaration then
        raise exception 'Authenticity and modification declaration is required to publish.';
      end if;
      new.published_at := coalesce(new.published_at, now());
    end if;
  elsif tg_op = 'UPDATE' then
    -- Prevent non-moderator from modifying review_status
    if new.review_status is distinct from old.review_status and not public.is_marketplace_moderator(auth.uid()) then
      raise exception 'Forbidden: review_status can only be updated by backend moderation.';
    end if;
    if new.status = 'published' and old.status <> 'published' then
      if not new.authenticity_declaration then
        raise exception 'Authenticity and modification declaration is required to publish.';
      end if;
      new.published_at := coalesce(old.published_at, now());
    end if;
  end if;

  -- Mask serial number automatically if private serial is provided
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
create trigger trg_enforce_listing_security
  before insert or update on public.listings
  for each row execute function public.enforce_listing_security();

alter table public.listings enable row level security;

-- Public can only see published or sold listings that are not rejected; owners and moderators see all their own
create policy "Public can view published non-rejected listings"
  on public.listings for select
  using (
    (status in ('published', 'sold') and review_status <> 'rejected')
    or auth.uid() = owner_id
    or public.is_marketplace_moderator(auth.uid())
  );

create policy "Owners can insert their own listings"
  on public.listings for insert
  with check (auth.uid() = owner_id);

create policy "Owners and moderators can update listings"
  on public.listings for update
  using (auth.uid() = owner_id or public.is_marketplace_moderator(auth.uid()))
  with check (auth.uid() = owner_id or public.is_marketplace_moderator(auth.uid()));

create policy "Owners can delete their draft or withdrawn listings"
  on public.listings for delete
  using (auth.uid() = owner_id and status in ('draft', 'withdrawn'));

-- 3. Listing Images (4 to 10 photos per published listing)
create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,
  slot_type text not null default 'extra' check (slot_type in ('dial', 'caseback', 'crown_sides', 'clasp_strap', 'ref_serial', 'extra')),
  caption text,
  sort_order integer not null default 0 check (sort_order >= 0 and sort_order < 10),
  mime_type text not null default 'image/jpeg' check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  file_size_bytes integer not null default 0 check (file_size_bytes >= 0 and file_size_bytes <= 8388608),
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'flagged')),
  is_sensitive_serial boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_listing_images_listing
  on public.listing_images (listing_id, sort_order asc);

alter table public.listing_images enable row level security;

create policy "Images visible when parent listing is visible and not sensitive serial"
  on public.listing_images for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id
        and (
          (l.status in ('published', 'sold') and l.review_status <> 'rejected' and not listing_images.is_sensitive_serial)
          or l.owner_id = auth.uid()
          or public.is_marketplace_moderator(auth.uid())
        )
    )
  );

create policy "Listing owners can manage their listing images"
  on public.listing_images for all
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id and l.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id and l.owner_id = auth.uid()
    )
  );

-- 4. Marketplace Favorites (avoid duplicates via unique constraint)
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint uq_favorites_user_listing unique (user_id, listing_id)
);

create index if not exists idx_favorites_user
  on public.favorites (user_id, created_at desc);

alter table public.favorites enable row level security;

create policy "Users can read and manage only their own favorites"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. Private Conversations (buyer <-> seller per listing)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null,
  buyer_name text not null,
  seller_id uuid not null,
  seller_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_conversations_distinct_participants check (buyer_id <> seller_id),
  constraint uq_conversations_listing_buyer unique (listing_id, buyer_id)
);

create index if not exists idx_conversations_participants
  on public.conversations (buyer_id, seller_id, updated_at desc);

alter table public.conversations enable row level security;

create policy "Only conversation participants can read conversations"
  on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Authenticated buyers can start a conversation"
  on public.conversations for insert
  with check (auth.uid() = buyer_id and buyer_id <> seller_id);

-- 6. Private Messages (strictly limited to conversation participants)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null,
  sender_name text not null,
  content text not null check (char_length(trim(content)) >= 1 and char_length(content) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conversation
  on public.messages (conversation_id, created_at asc);

alter table public.messages enable row level security;

create policy "Only conversation participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

create policy "Only conversation participants can send messages as themselves"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- 7. Listing Reports (User denunciations / moderation triggers)
create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid not null,
  reason text not null check (reason in ('counterfeit_suspicion', 'stolen_photos', 'misleading_description', 'off_platform_scam', 'other')),
  details text not null default '',
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid
);

create index if not exists idx_listing_reports_status
  on public.listing_reports (status, created_at desc);

alter table public.listing_reports enable row level security;

create policy "Reporters can create reports and moderators can read/manage"
  on public.listing_reports for select
  using (auth.uid() = reporter_id or public.is_marketplace_moderator(auth.uid()));

create policy "Users can submit listing reports"
  on public.listing_reports for insert
  with check (auth.uid() = reporter_id);

create policy "Moderators can update listing reports"
  on public.listing_reports for update
  using (public.is_marketplace_moderator(auth.uid()));

-- 8. Authenticity & Photo Reviews Log (audit trail of review transitions)
create table if not exists public.authenticity_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  status text not null check (status in ('pending', 'passed_photo_review', 'manual_review', 'rejected')),
  method text not null check (method in ('automated_slot_check', 'manual_moderator', 'external_ai_service')),
  internal_reasons text not null default '',
  public_note text not null default '',
  reviewer_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_authenticity_reviews_listing
  on public.authenticity_reviews (listing_id, created_at desc);

alter table public.authenticity_reviews enable row level security;

create policy "Moderators and listing owners can view review logs"
  on public.authenticity_reviews for select
  using (
    public.is_marketplace_moderator(auth.uid())
    or exists (
      select 1 from public.listings l
      where l.id = authenticity_reviews.listing_id and l.owner_id = auth.uid()
    )
  );

create policy "Only moderators can insert authenticity reviews"
  on public.authenticity_reviews for insert
  with check (public.is_marketplace_moderator(auth.uid()));
