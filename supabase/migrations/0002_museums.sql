-- Masterpiece Market — Museum Founding (Endgame)
-- Depends on: 0001_init.sql

-- ============================================================
-- MUSEUMS
-- A player-founded institution. One active museum per player.
-- ============================================================
create table public.museums (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  status          text not null default 'active' check (status in ('active','probation','dissolved')),
  endowment       bigint not null default 0,       -- locked credits
  staff_curator_count int not null default 1,       -- NPC curators assigned (1 at founding, max 3)
  level           text not null default 'emerging' check (level in ('emerging','established','landmark')),
  founded_at      timestamptz not null default now(),
  dissolved_at    timestamptz,                      -- set if dissolved
  created_at      timestamptz not null default now()
);

-- One active museum per player
create unique index idx_museum_owner_active on public.museums(owner_id) where status != 'dissolved';

-- ============================================================
-- MUSEUM ENDOWMENT LEDGER (append-only)
-- Tracks all deposits, withdrawals, and fee payments.
-- ============================================================
create table public.museum_endowment_ledger (
  id          uuid primary key default gen_random_uuid(),
  museum_id   uuid not null references public.museums(id) on delete cascade,
  delta       bigint not null,           -- positive = deposit, negative = withdrawal/fee
  reason      text not null,             -- 'founding_deposit' | 'topup' | 'exhibition_fee' | 'membership_revenue' | 'dissolution_return'
  balance_after bigint not null,         -- running balance after this entry
  created_at  timestamptz not null default now()
);

create index idx_endowment_museum on public.museum_endowment_ledger(museum_id, created_at);

-- ============================================================
-- MUSEUM MEMBERSHIPS
-- Other players subscribe to a museum.
-- ============================================================
create table public.museum_memberships (
  id          uuid primary key default gen_random_uuid(),
  museum_id   uuid not null references public.museums(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  tier        text not null default 'visitor' check (tier in ('visitor','patron','benefactor')),
  started_at  timestamptz not null default now(),
  ends_at     timestamptz not null,      -- membership expiry (4-week periods)
  auto_renew  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Prevent duplicate active memberships (enforce at application layer via check before insert;
-- a partial unique index with now() is not possible because now() is not IMMUTABLE).
-- Instead, use a simple unique on museum + user; expired rows should be soft-archived or deleted.
create unique index idx_membership_user_museum on public.museum_memberships(museum_id, user_id);

create index idx_membership_museum on public.museum_memberships(museum_id);

-- ============================================================
-- MUSEUM EXHIBITIONS
-- Themed shows hosted by a museum.
-- ============================================================
create table public.museum_exhibitions (
  id          uuid primary key default gen_random_uuid(),
  museum_id   uuid not null references public.museums(id) on delete cascade,
  title       text not null,
  theme       text,                      -- e.g. "Impressionist Landscapes", "The Human Form"
  description text,
  status      text not null default 'planned' check (status in ('planned','open','closed')),
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  visitors    int not null default 0,
  prestige_earned int not null default 0,
  created_at  timestamptz not null default now()
);

create index idx_museum_exhibitions on public.museum_exhibitions(museum_id, starts_at);

-- ============================================================
-- MUSEUM EXHIBITION LOANS
-- Individual artworks loaned into a museum exhibition.
-- Can be from the museum owner or other players.
-- ============================================================
create table public.museum_exhibition_loans (
  id              uuid primary key default gen_random_uuid(),
  exhibition_id   uuid not null references public.museum_exhibitions(id) on delete cascade,
  artwork_id      uuid not null references public.artworks(id),
  lender_id       uuid not null references public.profiles(id),  -- the artwork owner
  fee             bigint not null default 0,   -- loan fee paid to the lender from endowment
  status          text not null default 'active' check (status in ('active','returned','cancelled')),
  created_at      timestamptz not null default now()
);

create index idx_exhibition_loans on public.museum_exhibition_loans(exhibition_id);
create index idx_exhibition_loans_artwork on public.museum_exhibition_loans(artwork_id);
