-- Listings & Offers schema
-- Dealer-mediated direct sales alongside the auction system

-- ============================================================
-- LISTINGS
-- ============================================================
create table if not exists public.listings (
  id          uuid primary key default gen_random_uuid(),
  artwork_id  uuid not null references public.artworks(id),
  dealer_id   uuid not null references public.npcs(id),
  seller_id   uuid not null,  -- references profiles or npcs
  asking_price integer not null check (asking_price > 0),
  dealer_commission numeric(5,4) not null check (dealer_commission >= 0 and dealer_commission <= 1),
  status      text not null default 'active' check (status in ('active', 'sold', 'cancelled')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Only one active listing per artwork
create unique index if not exists idx_listings_active_artwork
  on public.listings (artwork_id) where status = 'active';

create index if not exists idx_listings_dealer on public.listings (dealer_id);
create index if not exists idx_listings_seller on public.listings (seller_id);
create index if not exists idx_listings_status on public.listings (status);

-- ============================================================
-- OFFERS
-- ============================================================
create table if not exists public.offers (
  id          uuid primary key default gen_random_uuid(),
  artwork_id  uuid not null references public.artworks(id),
  listing_id  uuid references public.listings(id),
  dealer_id   uuid not null references public.npcs(id),
  buyer_id    uuid not null,   -- references profiles
  seller_id   uuid not null,   -- references profiles or npcs
  amount      integer not null check (amount > 0),
  dealer_commission numeric(5,4) not null check (dealer_commission >= 0 and dealer_commission <= 1),
  status      text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'withdrawn', 'expired')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_offers_artwork on public.offers (artwork_id);
create index if not exists idx_offers_listing on public.offers (listing_id);
create index if not exists idx_offers_buyer on public.offers (buyer_id);
create index if not exists idx_offers_seller on public.offers (seller_id);
create index if not exists idx_offers_status on public.offers (status);

-- ============================================================
-- RLS (enable when auth is integrated)
-- ============================================================
-- alter table public.listings enable row level security;
-- alter table public.offers enable row level security;

-- Updated-at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

create trigger offers_updated_at
  before update on public.offers
  for each row execute function public.set_updated_at();
