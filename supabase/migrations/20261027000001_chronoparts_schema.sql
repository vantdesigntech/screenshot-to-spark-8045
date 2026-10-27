-- ChronoParts Production Schema for Supabase (PostgreSQL + RLS)
-- Automatically syncs OEM vs Aftermarket parts, AI Daily Chollos, Watchbox Favorites, Price Alerts & SEO Blog

create extension if not exists "pgcrypto";

-- 1. Parts Catalog (OEM, Aftermarket & Niche B2B Stores)
create table if not exists public.parts_catalog (
  id text primary key,
  title text not null,
  brand text not null,
  category text not null,
  store text not null,
  origin text not null check (origin in ('oem', 'generic')),
  price_eur numeric(10,2) not null,
  equivalent_oem_price_eur numeric(10,2),
  delivery text not null default '3–5d',
  image text not null,
  spec text not null,
  compatible_with text[] not null default '{}',
  oem_ref text,
  pair_group_id text,
  custom_url text,
  pro_only boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.parts_catalog enable row level security;

create policy "Public read access for parts_catalog"
  on public.parts_catalog for select
  using (true);

-- 2. AI Daily Deals / Chollos Diarios (Wallapop, eBay, Chrono24, Todocolección)
create table if not exists public.daily_chollos (
  id text primary key,
  title text not null,
  brand text not null,
  ref text not null,
  platform text not null check (platform in ('eBay', 'Wallapop', 'Chrono24', 'Todocolección')),
  deal_type text not null,
  price_eur numeric(10,2) not null,
  market_value_eur numeric(10,2) not null,
  discount_pct integer not null,
  profit_margin_eur numeric(10,2) not null,
  chollo_score numeric(3,1) not null,
  condition text not null,
  location text not null,
  time_left_or_posted text not null,
  seller_note text,
  ai_verdict text not null,
  image text not null,
  url text not null,
  pro_only boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.daily_chollos enable row level security;

create policy "Public read access for daily_chollos"
  on public.daily_chollos for select
  using (true);

-- 3. User Watchbox Favorites ("Mi Caja")
create table if not exists public.watchbox_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  client_session_id text,
  part_id text not null,
  part_title text not null,
  price_eur numeric(10,2) not null,
  store text not null,
  created_at timestamptz not null default now()
);

alter table public.watchbox_favorites enable row level security;

create policy "Users can read and manage their own watchbox favorites"
  on public.watchbox_favorites for all
  using (true)
  with check (true);

-- 4. PRO Price Drop & NOS Radar Alerts
create table if not exists public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  client_session_id text,
  part_id text not null,
  title text not null,
  target_eur numeric(10,2) not null,
  whatsapp_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.price_alerts enable row level security;

create policy "Users can read and manage their own price alerts"
  on public.price_alerts for all
  using (true)
  with check (true);

-- 5. Programmatic SEO Technical Watchmaking Articles
create table if not exists public.seo_articles (
  slug text primary key,
  title text not null,
  meta_title text not null,
  meta_description text not null,
  category text not null,
  read_time text not null,
  published_at date not null default current_date,
  updated_at date not null default current_date,
  keywords text[] not null default '{}',
  excerpt text not null,
  related_model_id text not null,
  related_search_query text not null,
  sections jsonb not null default '[]'::jsonb,
  faq jsonb not null default '[]'::jsonb
);

alter table public.seo_articles enable row level security;

create policy "Public read access for seo_articles"
  on public.seo_articles for select
  using (true);
