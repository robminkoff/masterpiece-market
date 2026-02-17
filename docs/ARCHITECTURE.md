# Architecture — Masterpiece Market v0.1

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                     │
│  Next.js App Router (React + TypeScript + TailwindCSS)   │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐  │
│  │  Catalog  │ │ Auction  │ │ Dashboard │ │  Artwork   │  │
│  │  Page     │ │  House   │ │           │ │  Detail    │  │
│  └────┬─────┘ └────┬─────┘ └─────┬─────┘ └─────┬─────┘  │
│       │            │             │              │         │
│  ┌────┴────────────┴─────────────┴──────────────┴─────┐  │
│  │              Zustand Store (client state)           │  │
│  └────────────────────┬───────────────────────────────┘  │
│                       │                                   │
│  ┌────────────────────┴───────────────────────────────┐  │
│  │          Socket.IO Client (live auctions)           │  │
│  └────────────────────┬───────────────────────────────┘  │
└───────────────────────┼───────────────────────────────────┘
                        │
          HTTP (REST)   │   WebSocket
                        │
┌───────────────────────┼───────────────────────────────────┐
│                   SERVER LAYER                             │
│                       │                                    │
│  ┌────────────────────┴──────────────┐                    │
│  │  Next.js API Routes (/api/*)      │ ← REST endpoints  │
│  │  - GET  /api/artworks             │                    │
│  │  - GET  /api/auctions             │                    │
│  │  - POST /api/auctions             │                    │
│  │  - POST /api/auctions/:id/bids    │                    │
│  │  - POST /api/auctions/:id/settle  │                    │
│  └────────────────────┬──────────────┘                    │
│                       │                                    │
│  ┌────────────────────┴──────────────┐                    │
│  │  Socket.IO Server (separate proc) │ ← WebSocket server│
│  │  Port 3001                        │                    │
│  │  - auction:join                   │                    │
│  │  - auction:bid                    │                    │
│  │  - auction:update                 │                    │
│  │  - auction:end                    │                    │
│  └────────────────────┬──────────────┘                    │
└───────────────────────┼────────────────────────────────────┘
                        │
┌───────────────────────┼────────────────────────────────────┐
│                   DATA LAYER                                │
│                       │                                     │
│  ┌────────────────────┴──────────────┐                     │
│  │  Supabase (Postgres + Auth)       │                     │
│  │  - profiles (extends auth.users)  │                     │
│  │  - artworks                       │                     │
│  │  - ownerships                     │                     │
│  │  - provenance_events              │                     │
│  │  - auctions / bids / sales        │                     │
│  │  - npcs / loan_offers / loans     │                     │
│  │  - exhibitions / billing_events   │                     │
│  └───────────────────────────────────┘                     │
│                                                             │
│  ┌───────────────────────────────────┐                     │
│  │  Redis (Upstash / in-memory stub) │                     │
│  │  - Active auction state           │                     │
│  │  - Bid queue / rate limiting      │                     │
│  │  - Session cache                  │                     │
│  └───────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14+ (App Router) | SSR, routing, React Server Components |
| Styling | TailwindCSS | Utility-first CSS |
| Client State | Zustand | Lightweight state management |
| Validation | Zod | Runtime schema validation, shared between client and server |
| Auth | Supabase Auth | User registration, login, sessions (stubbed for v0) |
| Database | Supabase (Postgres) | Primary data store with RLS |
| Cache/Queue | Redis (Upstash) | Auction state, rate limiting (stubbed for v0) |
| Realtime | Socket.IO | Live auction bidding |
| Language | TypeScript | End-to-end type safety |

## Data Flow: Auction Lifecycle

1. **Admin creates auction** → `POST /api/auctions` → inserts `auctions` row (status: scheduled)
2. **Auction goes live** → cron/scheduled check flips status to `live`, Socket.IO server creates room
3. **Player joins** → client connects to Socket.IO, emits `auction:join` → receives current state
4. **Player bids** → client emits `auction:bid` + `POST /api/auctions/:id/bids`
   - API validates: bid > current, bidder has credits, bidder not delinquent, tier access OK
   - On success: update auction row, insert bid row, broadcast via Socket.IO
5. **Late bid** → if bid within 15s of end, extend `ends_at` by 15s, broadcast `auction:extended`
6. **Timer expires** → Socket.IO server detects end, emits `auction:ended`
7. **Settlement** → `POST /api/auctions/:id/settle` (atomic transaction):
   - Debit buyer (bid + 5% buyer premium)
   - Credit seller (bid - 2.5% seller fee)
   - Transfer ownership (deactivate old, create new)
   - Record provenance event
   - Insert sale record
   - Update auction status to `settled`

## Data Flow: Weekly Billing

1. **Cron fires** (weekly) → enumerate all active ownerships
2. **Per artwork:** calculate `weeklyCarryCost(IV, tier, onLoan, idleWeeks)`
3. **Per owner:** sum all artwork costs into single bill
4. **Deduct** from `profiles.credits`
5. **Insert** `billing_events` row per artwork for audit trail
6. **If balance < 0:** flag owner as delinquent, start 72-hour grace timer
7. **After grace:** select lowest-tier works, create forced auctions
8. **Update** `idle_weeks` counter on each artwork (+1 if no activity, reset if active)

## API Routes (v0)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/artworks` | List all artworks | Public |
| GET | `/api/auctions` | List all auctions | Public |
| POST | `/api/auctions` | Create a new auction | Admin |
| POST | `/api/auctions/:id/bids` | Place a bid | Authenticated |
| POST | `/api/auctions/:id/settle` | Settle a completed auction | System/Admin |

## Socket.IO Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `auction:join` | Client → Server | `{ auction_id }` |
| `auction:state` | Server → Client | `{ current_bid, ends_at, title, bids[] }` |
| `auction:bid` | Client → Server | `{ auction_id, bidder_id, amount }` |
| `auction:bid` | Server → Client | `{ bidder_id, amount, time }` |
| `auction:extended` | Server → Client | `{ ends_at }` |
| `auction:ended` | Server → Client | `{ auction_id, winning_bid, winner }` |
| `error` | Server → Client | `{ message }` |

## Database Schema Overview

| Table | Purpose |
|-------|---------|
| `profiles` | Player data, extends Supabase auth.users. Credits, tier, prestige. |
| `artworks` | Unique artwork records with IV, tier, metadata. |
| `ownerships` | Current and historical ownership. One active row per artwork. |
| `provenance_events` | Append-only ledger of all ownership and activity events. |
| `auctions` | Auction records with status, timing, current bid. |
| `bids` | Individual bid records per auction. |
| `sales` | Completed sale transactions with fees. |
| `npcs` | Curator and dealer characters with traits. |
| `loan_offers` | Curator loan proposals (pending/accepted/declined). |
| `loans` | Active and completed loans. |
| `exhibitions` | Exhibition records linked to loans. |
| `billing_events` | Weekly cost records per artwork per owner (audit trail). |

Full schema: [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql)

## Folder Structure

```
masterpiece-market/
├── docs/                          # Game documentation
│   ├── GAME_OVERVIEW.md
│   ├── RULES.md
│   ├── ECONOMY_TUNING.md
│   ├── ARCHITECTURE.md
│   └── NEXT_STEPS.md
├── server/                        # Socket.IO server (separate process)
│   ├── package.json
│   ├── tsconfig.json
│   ├── README.md
│   └── src/index.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout with nav
│   │   ├── page.tsx               # Home page
│   │   ├── globals.css
│   │   ├── catalog/page.tsx
│   │   ├── artworks/[id]/page.tsx
│   │   ├── auction-house/page.tsx
│   │   ├── auction-house/live/[auctionId]/page.tsx
│   │   ├── dashboard/page.tsx
│   │   └── api/
│   │       ├── artworks/route.ts
│   │       ├── auctions/route.ts
│   │       └── auctions/[auctionId]/
│   │           ├── bids/route.ts
│   │           └── settle/route.ts
│   ├── components/
│   │   ├── ArtworkCard.tsx
│   │   ├── BidPanel.tsx
│   │   └── AuctionTimer.tsx
│   ├── data/seed.ts
│   └── lib/
│       ├── types.ts
│       ├── validators.ts
│       ├── store.ts
│       └── supabase.ts
├── supabase/migrations/0001_init.sql
├── scripts/seed.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Security Considerations (v0)

- Auth is stubbed with a fake user for dev; production uses Supabase Auth with Row-Level Security
- API routes validate inputs with Zod schemas
- WebSocket connections will need auth tokens in production
- Rate limiting on bid endpoints (Redis-backed in production)
- No direct DB access from client — all through API routes

## Scaling Notes (future)

- Socket.IO can be clustered with Redis adapter for multiple instances
- Supabase handles connection pooling automatically
- Static pages (catalog, artwork detail) can leverage ISR for caching
- Auction settlement should be idempotent (safe to retry)
- Weekly billing should use database transactions for atomicity
