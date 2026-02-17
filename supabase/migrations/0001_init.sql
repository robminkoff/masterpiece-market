-- Masterpiece Market — Initial Schema
-- Run against a Supabase Postgres instance.
-- Relies on Supabase Auth for user management (auth.users).

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null default 'Collector',
  tier          text not null default 'beginner' check (tier in ('beginner','mid','whale')),
  credits       bigint not null default 10000,
  prestige      int not null default 0,
  stewardship   int not null default 0,
  created_at    timestamptz not null default now(),
  last_active   timestamptz not null default now()
);

-- Auto-create profile on signup via trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ARTWORKS
-- Each artwork is a unique asset in the market.
-- ============================================================
create table public.artworks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  artist       text not null,
  year         int,
  medium       text,
  tier         text not null check (tier in ('A','B','C','D')),
  insured_value bigint not null,       -- IV in credits
  image_url    text,                    -- placeholder or real URL
  tags         text[] default '{}',
  description  text,
  created_at   timestamptz not null default now()
);

create index idx_artworks_tier on public.artworks(tier);

-- ============================================================
-- OWNERSHIPS
-- Current owner of each artwork. One active row per artwork.
-- ============================================================
create table public.ownerships (
  id           uuid primary key default gen_random_uuid(),
  artwork_id   uuid not null references public.artworks(id) on delete cascade,
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  acquired_at  timestamptz not null default now(),
  acquired_via text not null default 'auction', -- auction | direct_sale | estate | seed
  is_active    boolean not null default true,
  idle_weeks   int not null default 0,           -- weeks since last activity on this artwork
  on_loan      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Only one active ownership per artwork
create unique index idx_ownership_active on public.ownerships(artwork_id) where is_active = true;
create index idx_ownership_owner on public.ownerships(owner_id) where is_active = true;

-- ============================================================
-- PROVENANCE EVENTS (append-only ledger)
-- Every ownership change, loan, exhibition, etc.
-- ============================================================
create table public.provenance_events (
  id           uuid primary key default gen_random_uuid(),
  artwork_id   uuid not null references public.artworks(id) on delete cascade,
  event_type   text not null, -- 'created' | 'auction_sale' | 'direct_sale' | 'loan_start' | 'loan_end' | 'forced_sale' | 'estate_sale'
  from_owner   uuid references public.profiles(id),
  to_owner     uuid references public.profiles(id),
  price        bigint,
  metadata     jsonb default '{}',
  created_at   timestamptz not null default now()
);

create index idx_provenance_artwork on public.provenance_events(artwork_id, created_at);

-- ============================================================
-- AUCTIONS
-- ============================================================
create table public.auctions (
  id             uuid primary key default gen_random_uuid(),
  artwork_id     uuid not null references public.artworks(id),
  seller_id      uuid references public.profiles(id),  -- null for system/estate auctions
  auction_type   text not null default 'regular' check (auction_type in ('regular','evening','private','forced','estate')),
  status         text not null default 'scheduled' check (status in ('scheduled','live','ended','settled','cancelled')),
  starting_bid   bigint not null default 0,
  reserve_price  bigint,                                -- optional minimum sale price
  current_bid    bigint not null default 0,
  current_bidder uuid references public.profiles(id),
  bid_count      int not null default 0,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,                  -- extends on late bids
  settled_at     timestamptz,
  created_at     timestamptz not null default now()
);

create index idx_auctions_status on public.auctions(status, starts_at);
create index idx_auctions_artwork on public.auctions(artwork_id);

-- ============================================================
-- BIDS
-- ============================================================
create table public.bids (
  id          uuid primary key default gen_random_uuid(),
  auction_id  uuid not null references public.auctions(id) on delete cascade,
  bidder_id   uuid not null references public.profiles(id),
  amount      bigint not null,
  created_at  timestamptz not null default now()
);

create index idx_bids_auction on public.bids(auction_id, amount desc);

-- ============================================================
-- SALES (completed transactions)
-- ============================================================
create table public.sales (
  id            uuid primary key default gen_random_uuid(),
  auction_id    uuid references public.auctions(id),
  artwork_id    uuid not null references public.artworks(id),
  seller_id     uuid references public.profiles(id),
  buyer_id      uuid not null references public.profiles(id),
  sale_price    bigint not null,
  buyer_premium bigint not null default 0,     -- 5% buyer premium
  seller_fee    bigint not null default 0,     -- 2.5% seller fee
  sale_type     text not null default 'auction', -- auction | direct | forced | estate
  created_at    timestamptz not null default now()
);

-- ============================================================
-- NPCs — Curators & Dealers
-- ============================================================
create table public.npcs (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  role          text not null check (role in ('curator','dealer')),
  npc_tier      text not null,                  -- curator: assistant/curator/chief/legendary; dealer: primary/secondary/broker/specialist
  specialty     text,                           -- art style or service focus
  description   text,
  traits        jsonb default '{}',
  unlock_tier   text not null default 'beginner' check (unlock_tier in ('beginner','mid','whale')),
  created_at    timestamptz not null default now()
);

-- ============================================================
-- LOAN OFFERS (from curators)
-- ============================================================
create table public.loan_offers (
  id           uuid primary key default gen_random_uuid(),
  npc_id       uuid not null references public.npcs(id),
  artwork_id   uuid not null references public.artworks(id),
  owner_id     uuid not null references public.profiles(id),
  fee_amount   bigint not null,                 -- calculated loan fee
  duration_wks int not null default 2,
  status       text not null default 'pending' check (status in ('pending','accepted','declined','expired')),
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- LOANS (active / completed)
-- ============================================================
create table public.loans (
  id            uuid primary key default gen_random_uuid(),
  loan_offer_id uuid not null references public.loan_offers(id),
  artwork_id    uuid not null references public.artworks(id),
  owner_id      uuid not null references public.profiles(id),
  curator_id    uuid not null references public.npcs(id),
  started_at    timestamptz not null default now(),
  ends_at       timestamptz not null,
  fee_paid      bigint not null default 0,
  status        text not null default 'active' check (status in ('active','completed','recalled')),
  created_at    timestamptz not null default now()
);

-- ============================================================
-- EXHIBITIONS
-- ============================================================
create table public.exhibitions (
  id           uuid primary key default gen_random_uuid(),
  loan_id      uuid not null references public.loans(id),
  curator_id   uuid not null references public.npcs(id),
  title        text not null,
  description  text,
  started_at   timestamptz not null default now(),
  ends_at      timestamptz not null,
  visitors     int not null default 0,
  prestige_earned int not null default 0,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- BILLING LEDGER (weekly cost records)
-- ============================================================
create table public.billing_events (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id),
  artwork_id    uuid not null references public.artworks(id),
  week_of       date not null,
  premium       bigint not null,
  storage_fee   bigint not null,
  total         bigint not null,
  paid          boolean not null default false,
  created_at    timestamptz not null default now()
);

create index idx_billing_owner_week on public.billing_events(owner_id, week_of);
